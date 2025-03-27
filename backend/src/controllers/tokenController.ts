import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import tokenService from "../services/tokenService";
import accountService from "../services/accountService";
import { getUserTokenBalance, updateUserTokenBalance } from "./tokenHelpers";

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

/**
 * Get token balances for the current user
 * @route GET /api/tokens/balances
 */
export const getUserTokenBalances = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    console.log(`Getting token balances for user: ${userId}`);

    // Find the user with all fields (including tokenHoldings which might be select: false)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User found, token holdings:`, user.tokenHoldings);

    // If user has no token holdings
    if (!user.tokenHoldings || user.tokenHoldings.length === 0) {
      return res.status(200).json({ balances: [] });
    }

    // Get all tokens that the user holds
    const tokenIds = user.tokenHoldings.map((holding) => holding.tokenId);
    console.log(`Fetching token details for token IDs:`, tokenIds);

    const tokens = await Token.find({ tokenId: { $in: tokenIds } });
    console.log(`Found ${tokens.length} tokens`);

    // Combine token details with user's balances
    const balances = user.tokenHoldings.map((holding) => {
      const token = tokens.find((t) => t.tokenId === holding.tokenId);
      return {
        tokenId: holding.tokenId,
        symbol: token?.symbol || "UNKNOWN",
        name: token?.name || "Unknown Token",
        balance: holding.balance,
        stockCode: token?.stockCode || null,
        decimals: token?.decimals || 0,
        metadata: token?.metadata || {},
      };
    });

    console.log(`Returning balances:`, balances);
    res.status(200).json({ balances });
  } catch (error) {
    console.error("Get user token balances error:", error);
    res.status(500).json({ message: "Error getting token balances", error });
  }
};

/**
 * Sell tokens for HBAR
 * @route POST /api/tokens/:stockCode/sell
 * @access Private
 */
export const sellTokensForHbar = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    const { amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

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

    // Check if user has enough tokens
    const userTokenBalance = await getUserTokenBalance(userId, stockCode);
    if (userTokenBalance < amount) {
      return res.status(400).json({
        message: `Insufficient tokens. You have ${userTokenBalance} ${stockCode} tokens, but tried to sell ${amount}`,
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
    await updateUserTokenBalance(userId, stockCode, -amount);

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
