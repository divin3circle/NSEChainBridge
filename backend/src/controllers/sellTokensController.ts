import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import tokenService from "../services/tokenService";
import accountService from "../services/accountService";

/**
 * Sell tokens for HBAR
 * This function allows users to sell their tokens for HBAR based on the token's price in KES
 * @route POST /api/tokens/:stockCode/sell
 * @access Private
 */
export const sellTokensForHbar = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Check if token exists
    const token = await tokenService.getTokenByStockCode(stockCode);
    if (!token) {
      return res
        .status(404)
        .json({ message: `Token for stock ${stockCode} not found` });
    }

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.hederaAccountId) {
      return res
        .status(400)
        .json({ message: "User does not have a Hedera account" });
    }

    // Find the user's token holding
    const tokenHolding = user.tokenHoldings.find(
      (holding) => holding.tokenId === token.tokenId
    );

    if (!tokenHolding || tokenHolding.balance < amount) {
      return res.status(400).json({
        message: `Insufficient tokens. You have ${
          tokenHolding?.balance || 0
        } ${stockCode} tokens, but tried to sell ${amount}`,
      });
    }

    // Calculate HBAR value based on token price
    // Formula: (token price in KES / HBAR price in KES) * amount
    const HBAR_PRICE_KES = 24.51; // Get this from a service or config
    const tokenPriceKES = token.metadata.stockPrice || 0;

    // Calculate how many HBAR to transfer to the user
    const hbarAmount = (tokenPriceKES / HBAR_PRICE_KES) * amount;

    // 1. Burn the tokens
    await tokenService.burnTokens(token.tokenId, amount);

    // 2. Update user's token balance
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    user.tokenHoldings[tokenHoldingIndex].balance -= amount;

    // If balance is now zero, consider removing the holding completely
    if (user.tokenHoldings[tokenHoldingIndex].balance <= 0) {
      user.tokenHoldings.splice(tokenHoldingIndex, 1);
    }

    await user.save();

    // 3. Transfer HBAR to user
    const transferResult = await accountService.transferHbar(
      user.hederaAccountId,
      hbarAmount
    );

    // 4. Create transaction record
    const transaction = new Transaction({
      userId,
      tokenId: token.tokenId,
      stockCode,
      type: TransactionType.SELL,
      status: TransactionStatus.COMPLETED,
      amount,
      fee: 0,
      paymentTokenId: "HBAR",
      paymentAmount: hbarAmount,
      hederaTransactionId: transferResult.transactionId?.toString(),
    });
    await transaction.save();

    res.status(200).json({
      message: `Successfully sold ${amount} ${stockCode} tokens for ${hbarAmount.toFixed(
        8
      )} HBAR`,
      stockCode,
      tokensSold: amount,
      hbarReceived: hbarAmount,
      hbarPrice: HBAR_PRICE_KES,
      tokenPrice: tokenPriceKES,
      transactionId: transaction._id,
    });
  } catch (error: any) {
    console.error("Error selling tokens:", error);
    res.status(500).json({ message: error.message });
  }
};
