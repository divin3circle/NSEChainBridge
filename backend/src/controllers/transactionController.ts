import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import tokenService from "../services/tokenService";

/**
 * Buy tokens
 * @route POST /api/transactions/buy
 */
export const buyTokens = async (req: Request, res: Response) => {
  try {
    const { tokenId, amount, stockCode } = req.body;
    const userId = req.user.id;

    if (!tokenId || !amount || amount <= 0 || !stockCode) {
      return res.status(400).json({
        message: "Token ID, stock code, and a positive amount are required",
      });
    }

    // Find token and user
    const token = await Token.findOne({ tokenId });
    const user = await User.findById(userId);

    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.hederaAccountId) {
      return res.status(400).json({
        message: "You need a Hedera account to buy tokens",
      });
    }

    // Create a transaction record
    const transaction = new Transaction({
      userId,
      tokenId,
      stockCode,
      amount,
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING,
      fee: 0, // In a real implementation, calculate the fee
      paymentTokenId: "HBAR", // Assuming HBAR is used for payment
      paymentAmount: amount * 1, // Simplified pricing, would be calculated based on real exchange rates
    });

    await transaction.save();

    // TODO: Implement actual token purchase with Hedera SDK
    // This would involve:
    // 1. Checking if the user has sufficient funds
    // 2. Executing the token transfer on Hedera
    // 3. Updating the transaction status to COMPLETED

    // For now, we'll simulate a successful purchase
    transaction.status = TransactionStatus.COMPLETED;
    await transaction.save();

    // Update user's token holdings
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === tokenId
    );

    if (tokenHoldingIndex === -1) {
      user.tokenHoldings.push({
        tokenId,
        balance: amount,
      });
    } else {
      user.tokenHoldings[tokenHoldingIndex].balance += amount;
    }

    await user.save();

    res.status(200).json({
      message: "Tokens purchased successfully",
      transaction,
    });
  } catch (error) {
    console.error("Buy tokens error:", error);
    res.status(500).json({ message: "Error buying tokens", error });
  }
};

/**
 * Sell tokens
 * @route POST /api/transactions/sell
 */
export const sellTokens = async (req: Request, res: Response) => {
  try {
    const { tokenId, amount, stockCode } = req.body;
    const userId = req.user.id;

    if (!tokenId || !amount || amount <= 0 || !stockCode) {
      return res.status(400).json({
        message: "Token ID, stock code, and a positive amount are required",
      });
    }

    // Find token and user
    const token = await Token.findOne({ tokenId });
    const user = await User.findById(userId);

    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has enough tokens
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === tokenId
    );

    if (
      tokenHoldingIndex === -1 ||
      user.tokenHoldings[tokenHoldingIndex].balance < amount
    ) {
      return res.status(400).json({
        message: "Insufficient token balance",
      });
    }

    // Create a transaction record
    const transaction = new Transaction({
      userId,
      tokenId,
      stockCode,
      amount,
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING,
      fee: 0, // In a real implementation, calculate the fee
      paymentTokenId: "HBAR", // Assuming HBAR is used for payment
      paymentAmount: amount * 1, // Simplified pricing, would be calculated based on real exchange rates
    });

    await transaction.save();

    // TODO: Implement actual token sale with Hedera SDK
    // This would involve:
    // 1. Executing the token transfer on Hedera
    // 2. Updating the transaction status to COMPLETED

    // For now, we'll simulate a successful sale
    transaction.status = TransactionStatus.COMPLETED;
    await transaction.save();

    // Update user's token holdings
    user.tokenHoldings[tokenHoldingIndex].balance -= amount;

    // Remove token holding if balance is zero
    if (user.tokenHoldings[tokenHoldingIndex].balance === 0) {
      user.tokenHoldings.splice(tokenHoldingIndex, 1);
    }

    await user.save();

    res.status(200).json({
      message: "Tokens sold successfully",
      transaction,
    });
  } catch (error) {
    console.error("Sell tokens error:", error);
    res.status(500).json({ message: "Error selling tokens", error });
  }
};

/**
 * Get user transaction history
 * @route GET /api/transactions/history
 */
export const getUserTransactionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Get transaction history error:", error);
    res
      .status(500)
      .json({ message: "Error getting transaction history", error });
  }
};
