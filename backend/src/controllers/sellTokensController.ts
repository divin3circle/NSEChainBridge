import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import {
  swapExactTokensForTokens,
  approveAllowance,
  associateTokenToAccount,
} from "../../scripts/swapTokens.js";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { deductHbarFees, getTransactionFees } from "./tokenHelpers";

const USDC_TOKEN_ID = "0.0.5791936";
const USDC_TOKEN_ADDRESS = "0x00000000000000000000000000000000005860c0";
const ROUTER_CONTRACT_ID = "0.0.19264";

// Helper function to convert token ID to EVM address
function tokenIdToEvmAddress(tokenId: string): string {
  // Remove the '0.0.' prefix and convert to hex
  const numericId = tokenId.split(".")[2];
  // Ensure exactly 40 characters (20 bytes) for the address
  const hexId = parseInt(numericId).toString(16).toLowerCase();
  return `0x${hexId.padStart(40, "0")}`;
}

/**
 * Sell tokens for USDC using SaucerSwap
 * This function allows users to swap their stock tokens for USDC
 * @route POST /api/tokens/:stockCode/sell
 * @access Private
 */
export const sellTokensForUsdc = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    const { amount, accountId, privateKey } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!accountId || !privateKey) {
      return res.status(400).json({ message: "Account credentials required" });
    }

    // Get the stock token
    const stockToken = await Token.findOne({ stockCode });
    if (!stockToken) {
      return res
        .status(404)
        .json({ message: `Token for stock ${stockCode} not found` });
    }

    // Get user and verify token balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tokenHolding = user.tokenHoldings.find(
      (holding) => holding.tokenId === stockToken.tokenId
    );

    if (!tokenHolding || tokenHolding.balance < amount) {
      return res.status(400).json({
        message: `Insufficient tokens. You have ${
          tokenHolding?.balance || 0
        } ${stockCode} tokens, but tried to sell ${amount}`,
      });
    }

    try {
      // Initialize Hedera client with user's credentials
      const client = Client.forTestnet();
      const userAccountId = AccountId.fromString(accountId);
      const userPrivateKey = PrivateKey.fromStringDer(privateKey);
      client.setOperator(userAccountId, userPrivateKey);

      console.log("Setting up token allowance for router...");

      // Associate the stock token to the user's account
      try {
        console.log("Associating stock token to account...", userAccountId);
        await associateTokenToAccount(
          client,
          userAccountId,
          userPrivateKey,
          stockToken.tokenId
        );
        await associateTokenToAccount(
          client,
          userAccountId,
          userPrivateKey,
          USDC_TOKEN_ID
        );
      } catch (error: any) {
        console.log(
          "Token likely already associated or error occurred:",
          error.message
        );
      }

      // Approve allowance for the router contract before swap
      console.log(
        "Approving allowance for the router contract...",
        userAccountId
      );
      await approveAllowance(
        client,
        userAccountId,
        userPrivateKey,
        stockToken.tokenId,
        ROUTER_CONTRACT_ID,
        amount * 1.1
      );

      console.log("Token allowance approved. Proceeding with swap...");

      // Calculate minimum USDC to receive based on stock price (0.3 USDC per token)
      const minUsdcAmount = 0; // 1% slippage

      // Convert token IDs to EVM addresses for the swap path
      const stockTokenAddress = tokenIdToEvmAddress(stockToken.tokenId);
      const accountAddress = tokenIdToEvmAddress(userAccountId.toString());

      // Execute the swap with EVM addresses
      console.log("Executing the swap...", accountAddress);
      const swapResult = await swapExactTokensForTokens(
        client,
        ROUTER_CONTRACT_ID,
        amount,
        minUsdcAmount,
        [stockTokenAddress, USDC_TOKEN_ADDRESS],
        accountAddress,
        Math.floor(Date.now() / 1000) + 600 // 10 minutes deadline
      );

      // Get actual transaction fees
      console.log("Original transaction ID:", swapResult.transactionId);
      const actualFee = await getTransactionFees(swapResult.transactionId);
      console.log(`Actual transaction fee: ${actualFee} HBAR`);

      // Update user's token holdings
      // Subtract the sold tokens from both balance and lockedQuantity
      const tokenHoldingIndex = user.tokenHoldings.findIndex(
        (holding) => holding.tokenId === stockToken.tokenId
      );
      const stockHoldingIndex = user.stockHoldings.findIndex(
        (holding) => holding.stockCode === stockCode
      );

      if (stockHoldingIndex === -1) {
        throw new Error(`Stock holding not found for ${stockCode}`);
      }
      user.tokenHoldings[tokenHoldingIndex].balance -= amount;
      user.stockHoldings[stockHoldingIndex].lockedQuantity -= amount;
      user.stockHoldings[stockHoldingIndex].quantity -= amount;

      if (user.tokenHoldings[tokenHoldingIndex].balance <= 0) {
        user.tokenHoldings.splice(tokenHoldingIndex, 1);
      }

      // Add the received USDC
      const usdcAmount = parseFloat(swapResult.outputAmount);
      const usdcHoldingIndex = user.tokenHoldings.findIndex(
        (holding) => holding.tokenId === USDC_TOKEN_ID
      );

      // Deduct actual HBAR fees
      await deductHbarFees(userId, actualFee);

      if (usdcHoldingIndex >= 0) {
        user.tokenHoldings[usdcHoldingIndex].balance += usdcAmount;
      } else {
        user.tokenHoldings.push({
          tokenId: USDC_TOKEN_ID,
          balance: usdcAmount,
          lockedQuantity: 0,
        });
      }

      await user.save();

      // Create transaction record with actual fee
      const transaction = new Transaction({
        userId,
        tokenId: stockToken.tokenId,
        stockCode,
        type: TransactionType.SELL,
        status: TransactionStatus.COMPLETED,
        amount,
        fee: actualFee,
        paymentTokenId: USDC_TOKEN_ID,
        paymentAmount: usdcAmount,
        hederaTransactionId: swapResult.transactionId,
      });
      await transaction.save();

      res.status(200).json({
        message: `Successfully swapped ${amount} ${stockCode} tokens for ${usdcAmount} USDC`,
        stockCode,
        tokensSold: amount,
        usdcReceived: usdcAmount,
        transactionId: transaction._id,
        hederaTransactionId: swapResult.transactionId,
        stockHolding: {
          availableQuantity:
            user.tokenHoldings[tokenHoldingIndex]?.balance || 0,
          lockedQuantity:
            user.tokenHoldings[tokenHoldingIndex]?.lockedQuantity || 0,
        },
        transaction: {
          hederaTransactionId: swapResult.transactionId,
          fee: actualFee,
          paymentAmount: usdcAmount,
          type: TransactionType.SELL,
          status: TransactionStatus.COMPLETED,
          timestamp: transaction.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error executing swap:", error);
      res.status(500).json({
        message: "Failed to execute swap",
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error("Error selling tokens:", error);
    res.status(500).json({ message: error.message });
  }
};
