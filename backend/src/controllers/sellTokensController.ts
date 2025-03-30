import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import tokenService from "../services/tokenService";
import saucerSwapService from "../services/saucerSwapService";

/**
 * Sell tokens for USDC using SaucerSwap
 * This function allows users to swap their stock tokens for USDC
 * @route POST /api/tokens/:stockCode/sell
 * @access Private
 */
export const sellTokensForUsdc = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Get the stock token
    const stockToken = await tokenService.getTokenByStockCode(stockCode);
    if (!stockToken) {
      return res
        .status(404)
        .json({ message: `Token for stock ${stockCode} not found` });
    }

    // Get the USDC token
    const usdcToken = await tokenService.getTokenByStockCode("USDC");
    if (!usdcToken) {
      return res.status(404).json({ message: "USDC token not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.hederaAccountId) {
      return res
        .status(400)
        .json({ message: "User does not have a Hedera account" });
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

    // Calculate minimum USDC to receive based on stock price
    const stockPriceUSD = stockToken.metadata.stockPrice || 0;
    const minUsdcAmount = Math.floor(stockPriceUSD * amount * 0.99); // 1% slippage

    try {
      // 1. Associate USDC token with user's account if not already associated
      try {
        await saucerSwapService.associateTokenForSwap(
          usdcToken.tokenId,
          user.hederaAccountId,
          userId
        );
      } catch (error: any) {
        // If the error is that the token is already associated, we can continue
        if (error.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")) {
          console.log("Token already associated with account, continuing...");
        } else {
          // If it's a different error, throw it
          throw error;
        }
      }

      // 2. Approve SaucerSwap to spend the stock tokens
      await saucerSwapService.approveTokenSpending(
        stockToken.tokenId,
        amount,
        user.hederaAccountId,
        userId
      );

      // 3. Execute the swap
      const swapResult = await saucerSwapService.swapExactTokensForTokens(
        amount,
        minUsdcAmount,
        [stockToken.tokenId, usdcToken.tokenId],
        user.hederaAccountId,
        Math.floor(Date.now() / 1000) + 300 // 5 minutes deadline
      );

      // 4. Update user's token holdings
      const tokenHoldingIndex = user.tokenHoldings.findIndex(
        (holding) => holding.tokenId === stockToken.tokenId
      );
      user.tokenHoldings[tokenHoldingIndex].balance -= amount;

      if (user.tokenHoldings[tokenHoldingIndex].balance <= 0) {
        user.tokenHoldings.splice(tokenHoldingIndex, 1);
      }

      await user.save();

      // 5. Create transaction record
      const transaction = new Transaction({
        userId,
        tokenId: stockToken.tokenId,
        stockCode,
        type: TransactionType.SELL,
        status: TransactionStatus.COMPLETED,
        amount,
        fee: 0,
        paymentTokenId: usdcToken.tokenId,
        paymentAmount: swapResult.finalOutputAmount,
        hederaTransactionId: swapResult.transactionId,
      });
      await transaction.save();

      res.status(200).json({
        message: `Successfully swapped ${amount} ${stockCode} tokens for ${swapResult.finalOutputAmount} USDC`,
        stockCode,
        tokensSold: amount,
        usdcReceived: swapResult.finalOutputAmount,
        transactionId: transaction._id,
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
