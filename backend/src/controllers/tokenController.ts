import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import tokenService from "../services/tokenService";

/**
 * Get all tokens
 * @route GET /api/tokens
 */
export const getAllTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await Token.find();

    res.status(200).json({ tokens });
  } catch (error) {
    console.error("Get all tokens error:", error);
    res.status(500).json({ message: "Error getting tokens", error });
  }
};

/**
 * Get token by ID
 * @route GET /api/tokens/:id
 */
export const getTokenById = async (req: Request, res: Response) => {
  try {
    const token = await Token.findOne({ tokenId: req.params.id });

    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }

    res.status(200).json({ token });
  } catch (error) {
    console.error("Get token error:", error);
    res.status(500).json({ message: "Error getting token", error });
  }
};

/**
 * Create a token for a stock
 * @route POST /api/tokens/create
 */
export const createStockToken = async (req: Request, res: Response) => {
  try {
    const { stockCode, stockName, initialSupply } = req.body;

    if (!stockCode || !stockName) {
      return res.status(400).json({
        message: "Stock code and name are required",
      });
    }

    // Check if token already exists for this stock
    const existingToken = await tokenService.getTokenByStockCode(stockCode);
    if (existingToken) {
      return res.status(400).json({
        message: `Token already exists for stock ${stockCode}`,
        token: existingToken,
      });
    }

    // Create the token
    const token = await tokenService.createStockToken(
      stockCode,
      stockName,
      initialSupply || 0
    );

    res.status(201).json({
      message: "Stock token created successfully",
      token,
    });
  } catch (error) {
    console.error("Create stock token error:", error);
    res.status(500).json({ message: "Error creating stock token", error });
  }
};

/**
 * Mint tokens from stock holdings
 * @route POST /api/tokens/:stockCode/mint
 */
export const mintStockTokens = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const { stockCode } = req.params;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "A positive amount is required",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a Hedera account
    if (!user.hederaAccountId) {
      return res.status(400).json({
        message: "You need a Hedera account to mint tokens",
      });
    }

    // Find the stock holding
    const stockHoldingIndex = user.stockHoldings.findIndex(
      (holding) => holding.stockCode === stockCode
    );

    if (stockHoldingIndex === -1) {
      return res.status(404).json({
        message: `You don't hold any ${stockCode} stock`,
      });
    }

    const stockHolding = user.stockHoldings[stockHoldingIndex];

    // Calculate available (unlocked) quantity
    const availableQuantity =
      stockHolding.quantity - stockHolding.lockedQuantity;

    if (availableQuantity < amount) {
      return res.status(400).json({
        message: `Cannot mint ${amount} tokens. You only have ${availableQuantity} available ${stockCode} shares.`,
      });
    }

    // Find token for this stock
    let token = await tokenService.getTokenByStockCode(stockCode);

    if (!token) {
      return res.status(404).json({
        message: `No token exists for stock ${stockCode}`,
      });
    }

    // Check if user's account is associated with this token
    try {
      // First, try to associate the token with the user's account
      // This will fail if already associated, which is fine
      await tokenService.associateTokenToAccount(
        token.tokenId,
        user.hederaAccountId,
        user.privateKey!
      );
    } catch (error) {
      console.log("Token association error or already associated:", error);
      // Continue if there was an error (likely already associated)
    }

    // Mint tokens and transfer to user
    const mintReceipt = await tokenService.mintTokens(
      token.tokenId,
      amount,
      user.hederaAccountId // Send directly to user
    );

    // Create transaction record
    const transaction = new Transaction({
      userId: userId,
      tokenId: token.tokenId,
      stockCode,
      amount,
      type: TransactionType.MINT,
      status: TransactionStatus.COMPLETED,
      fee: 0, // Set fee if applicable
      paymentTokenId: "HBAR",
      paymentAmount: 0, // No payment for minting, just reducing available stock
      hederaTransactionId: mintReceipt.transactionId?.toString(),
    });

    await transaction.save();

    // Update the user's token holdings
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    if (tokenHoldingIndex === -1) {
      user.tokenHoldings.push({
        tokenId: token.tokenId,
        balance: amount,
      });
    } else {
      user.tokenHoldings[tokenHoldingIndex].balance += amount;
    }

    // Update the user's stock holdings to reflect locked amount
    user.stockHoldings[stockHoldingIndex].lockedQuantity += amount;

    await user.save();

    res.status(200).json({
      message: `Successfully minted ${amount} ${stockCode} tokens`,
      transaction: transaction,
      tokenHolding: {
        tokenId: token.tokenId,
        symbol: token.symbol,
        balance:
          tokenHoldingIndex === -1
            ? amount
            : user.tokenHoldings[tokenHoldingIndex].balance,
      },
      stockHolding: {
        stockCode,
        quantity: user.stockHoldings[stockHoldingIndex].quantity,
        lockedQuantity: user.stockHoldings[stockHoldingIndex].lockedQuantity,
        availableQuantity:
          user.stockHoldings[stockHoldingIndex].quantity -
          user.stockHoldings[stockHoldingIndex].lockedQuantity,
      },
    });
  } catch (error) {
    console.error("Mint stock tokens error:", error);
    res.status(500).json({ message: "Error minting tokens", error });
  }
};

/**
 * Burn tokens to reclaim stock
 * @route POST /api/tokens/:stockCode/burn
 */
export const burnStockTokens = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const { stockCode } = req.params;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "A positive amount is required",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a Hedera account
    if (!user.hederaAccountId) {
      return res.status(400).json({
        message: "You need a Hedera account to burn tokens",
      });
    }

    // Find the token for this stock
    const token = await tokenService.getTokenByStockCode(stockCode);

    if (!token) {
      return res.status(404).json({
        message: `No token exists for stock ${stockCode}`,
      });
    }

    // Find the token holding
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    if (
      tokenHoldingIndex === -1 ||
      user.tokenHoldings[tokenHoldingIndex].balance < amount
    ) {
      return res.status(400).json({
        message: `Insufficient ${stockCode} token balance`,
      });
    }

    // Burn tokens with Hedera SDK
    try {
      await tokenService.burnTokens(token.tokenId, amount);
    } catch (error) {
      console.error("Error burning tokens on Hedera:", error);
      return res
        .status(500)
        .json({ message: "Error burning tokens on Hedera", error });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: userId,
      tokenId: token.tokenId,
      stockCode,
      amount,
      type: TransactionType.BURN,
      status: TransactionStatus.COMPLETED,
      fee: 0,
      paymentTokenId: "HBAR",
      paymentAmount: 0,
      hederaTransactionId: "placeholder", // Would be set from actual Hedera transaction
    });

    await transaction.save();

    // Update the user's token holdings
    user.tokenHoldings[tokenHoldingIndex].balance -= amount;

    // Remove token holding if balance is zero
    if (user.tokenHoldings[tokenHoldingIndex].balance === 0) {
      user.tokenHoldings.splice(tokenHoldingIndex, 1);
    }

    // Update the user's stock holdings
    const stockHoldingIndex = user.stockHoldings.findIndex(
      (holding) => holding.stockCode === stockCode
    );

    if (stockHoldingIndex === -1) {
      // User didn't have this stock before, add it
      user.stockHoldings.push({
        stockCode,
        quantity: amount,
        lockedQuantity: 0,
      });
    } else {
      // Reduce locked quantity
      user.stockHoldings[stockHoldingIndex].lockedQuantity = Math.max(
        0,
        user.stockHoldings[stockHoldingIndex].lockedQuantity - amount
      );
    }

    await user.save();

    res.status(200).json({
      message: `Successfully burned ${amount} ${stockCode} tokens`,
      transaction: transaction,
      stockHolding:
        stockHoldingIndex !== -1
          ? {
              stockCode,
              quantity: user.stockHoldings[stockHoldingIndex].quantity,
              lockedQuantity:
                user.stockHoldings[stockHoldingIndex].lockedQuantity,
              availableQuantity:
                user.stockHoldings[stockHoldingIndex].quantity -
                user.stockHoldings[stockHoldingIndex].lockedQuantity,
            }
          : null,
    });
  } catch (error) {
    console.error("Burn stock tokens error:", error);
    res.status(500).json({ message: "Error burning tokens", error });
  }
};
