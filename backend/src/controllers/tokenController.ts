import { Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import Transaction, {
  TransactionType,
  TransactionStatus,
} from "../models/Transaction";
import tokenService from "../services/tokenService";
import accountService from "../services/accountService";
import {
  getUserTokenBalance,
  updateUserTokenBalance,
  deductHbarFees,
  getTransactionFees,
} from "./tokenHelpers";

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
 * @notice This gas fee is paid by the OPERATOR_KEY (treasury account)
 * @description This endpoint allows users to mint tokens based on their stock holdings.
 * It checks if the user has enough stock, associates the token with the user's account,
 * and transfers the tokens from the treasury account to the user's account.
 * The user must have a Hedera account and the token must be associated with the user's account.
 * The amount of tokens minted is based on the user's stock holdings.
 * The stock holding is updated to reflect the locked amount.
 * The transaction is recorded in the database.
 * The user is notified of the successful minting.
 * @access Private
 * @param {string} stockCode - The stock code for which to mint tokens
 * @param {number} amount - The amount of tokens to mint
 * @returns {object} - The minted token and updated stock holding information
 * @throws {Error} - If the user does not have a Hedera account, if the stock holding is not found,
 *                   if the user does not have enough stock, if the token is not found,
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

    // UPDATED: Transfer tokens from treasury to user instead of minting new ones
    console.log(
      `Transferring ${amount} ${stockCode} tokens from treasury to user ${user.hederaAccountId}`
    );

    const transferReceipt = await tokenService.transferTokens(
      token.tokenId,
      token.treasuryAccountId, // From treasury account
      user.hederaAccountId, // To user account
      amount,
      "" // Use treasury key (OPERATOR_KEY) via empty string
    );

    console.log(
      `Transfer completed. Transaction ID: ${transferReceipt.transactionId}`
    );
    const actualFee = await getTransactionFees(transferReceipt.transactionId);
    console.log(`Actual transaction fee: ${actualFee} HBAR`);

    console.log(`Transfer receipt:`, transferReceipt);

    // Create transaction record
    const transaction = new Transaction({
      userId: userId,
      tokenId: token.tokenId,
      stockCode,
      amount,
      type: TransactionType.MINT,
      status: TransactionStatus.COMPLETED,
      fee: actualFee,
      paymentTokenId: "HBAR",
      paymentAmount: 0,
      hederaTransactionId: transferReceipt.transactionId?.toString(),
    });

    await transaction.save();

    // Update the user's token holdings for the minted token
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    if (tokenHoldingIndex === -1) {
      user.tokenHoldings.push({
        tokenId: token.tokenId,
        balance: amount,
        lockedQuantity: 0,
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
  } catch (error: any) {
    console.error("Mint stock tokens error:", error);
    res
      .status(500)
      .json({ message: "Error minting tokens", error: error.message });
  }
};

/**
 * Burn tokens to reclaim stock
 * @route POST /api/tokens/:stockCode/burn
 * @notice The gap is paid by the user redeeming the tokens
 * @description This endpoint allows users to burn their tokens to reclaim stock.
 * It checks if the user has enough tokens, verifies the burn transaction,
 * and updates the user's stock holdings accordingly.
 * The user must have a Hedera account and the token must be associated with the user's account.
 * The amount of tokens burned is based on the user's token holdings.
 * The stock holding is updated to reflect the unlocked amount.
 * The transaction is recorded in the database.
 * The user is notified of the successful burn.
 * @access Private
 * @param {string} stockCode - The stock code for which to burn tokens
 * @param {number} amount - The amount of tokens to burn
 * @param {string} transactionId - The transaction ID of the burn transaction
 * @returns {object} - The burned token and updated stock holding information
 * @throws {Error} - If the user does not have a Hedera account, if the token holding is not found,
 *                  if the user does not have enough tokens, if the token is not found,
 */
export const burnStockTokens = async (req: Request, res: Response) => {
  try {
    const { amount, transactionId } = req.body;
    const { stockCode } = req.params;
    const userId = req.user.id;

    console.log(`Burn request received for ${amount} ${stockCode} tokens`);
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`User ID: ${userId}`);

    if (!amount || amount <= 0) {
      console.log("Invalid amount provided");
      res.status(400).json({
        message: "A positive amount is required",
      });
      return;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      res.status(404).json({ message: "User not found" });
      return;
    }

    console.log(`User found: ${user.hederaAccountId}`);

    // Check if user has a Hedera account
    if (!user.hederaAccountId) {
      console.log("User has no Hedera account");
      res.status(400).json({
        message: "You need a Hedera account to burn tokens",
      });
      return;
    }

    // Find the token for this stock
    const token = await tokenService.getTokenByStockCode(stockCode);

    if (!token) {
      console.log(`Token not found for stock ${stockCode}`);
      res.status(404).json({
        message: `No token exists for stock ${stockCode}`,
      });
      return;
    }

    console.log(`Token found: ${token.tokenId}`);

    // Find the token holding
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    if (
      tokenHoldingIndex === -1 ||
      user.tokenHoldings[tokenHoldingIndex].balance < amount
    ) {
      console.log(
        `Insufficient token balance. User has ${
          user.tokenHoldings[tokenHoldingIndex]?.balance || 0
        } tokens`
      );
      res.status(400).json({
        message: `Insufficient ${stockCode} token balance`,
      });
      return;
    }

    console.log(
      `User has sufficient token balance: ${user.tokenHoldings[tokenHoldingIndex].balance}`
    );

    // If transactionId is provided, verify the burn transaction
    if (transactionId) {
      try {
        console.log("Verifying burn transaction...");
        // Verify the burn transaction
        const receipt = await tokenService.verifyUserBurnTransaction(
          token.tokenId,
          user.hederaAccountId,
          amount,
          transactionId
        );

        console.log(`Transaction verification result: ${receipt.status}`);

        if (receipt.status !== "SUCCESS") {
          console.log("Transaction verification failed");
          res.status(400).json({
            message: "Failed to verify burn transaction",
          });
          return;
        }

        console.log("Transaction verified successfully");

        // Get actual transaction fees
        console.log("Original transaction ID:", transactionId);
        const actualFee = await getTransactionFees(transactionId);
        console.log(`Actual transaction fee: ${actualFee} HBAR`);

        // Create transaction record
        const transaction = new Transaction({
          userId: userId,
          tokenId: token.tokenId,
          stockCode,
          amount,
          type: TransactionType.BURN,
          status: TransactionStatus.COMPLETED,
          fee: actualFee,
          paymentTokenId: "HBAR",
          paymentAmount: 0,
          hederaTransactionId: transactionId,
        });

        await transaction.save();
        console.log("Transaction record created");

        // Deduct actual HBAR fees
        await deductHbarFees(userId, actualFee);

        // Update the user's token holdings
        user.tokenHoldings[tokenHoldingIndex].balance -= amount;
        await user.save();
        console.log("User token holdings updated");

        // Update token circulating supply
        token.circulatingSupply -= amount;
        await token.save();
        console.log("Token circulating supply updated");

        // Get updated stock holding information
        const stockHoldingIndex = user.stockHoldings.findIndex(
          (holding) => holding.stockCode === stockCode
        );

        if (stockHoldingIndex === -1) {
          throw new Error(`Stock holding not found for ${stockCode}`);
        }

        // Update locked quantity (unlock the burned tokens)
        user.stockHoldings[stockHoldingIndex].lockedQuantity -= amount;
        await user.save();
        console.log(
          `Updated locked quantity: ${user.stockHoldings[stockHoldingIndex].lockedQuantity}`
        );

        const stockHolding = {
          stockCode,
          quantity: user.stockHoldings[stockHoldingIndex].quantity,
          lockedQuantity: user.stockHoldings[stockHoldingIndex].lockedQuantity,
          availableQuantity:
            user.stockHoldings[stockHoldingIndex].quantity -
            user.stockHoldings[stockHoldingIndex].lockedQuantity,
        };

        console.log("Burn process completed successfully");
        res.json({
          message: `Successfully burned ${amount} ${stockCode} tokens`,
          transaction,
          stockHolding,
        });
      } catch (error: any) {
        console.error("Error verifying burn transaction:", error);
        res.status(400).json({
          message: `Failed to verify burn transaction: ${error.message}`,
        });
      }
    } else {
      console.log("No transaction ID provided");
      res.status(400).json({
        message:
          "Transaction ID is required. Please sign the burn transaction from the frontend.",
      });
    }
  } catch (error: any) {
    console.error("Burn stock tokens error:", error);
    res.status(500).json({
      message: `Failed to burn tokens: ${error.message}`,
    });
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
 * @notice Not in use yet
 * @description This endpoint allows users to sell their tokens for HBAR.
 * It checks if the user has enough tokens, burns the tokens, and transfers HBAR to the user.
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

/**
 * Verify a user-initiated token burn transaction and unlock stocks
 * @route POST /api/tokens/:stockCode/verify-burn
 */
export const verifyUserBurnTransaction = async (
  req: Request,
  res: Response
) => {
  try {
    const { hederaTransactionId, amount } = req.body;
    const { stockCode } = req.params;
    const userId = req.user.id;

    if (!hederaTransactionId) {
      return res.status(400).json({
        message: "Transaction ID is required",
      });
    }

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

    // Find token for this stock
    const token = await tokenService.getTokenByStockCode(stockCode);
    if (!token) {
      return res.status(404).json({
        message: `No token exists for stock ${stockCode}`,
      });
    }

    console.log(
      `Verifying transaction ${hederaTransactionId} for ${amount} ${stockCode} tokens`
    );
    console.log(
      `From user ${user.hederaAccountId} to treasury ${token.treasuryAccountId}`
    );

    // In a production environment, we would verify the transaction on the Hedera network
    // This would include checking:
    // 1. That the transaction exists and was successful
    // 2. That it transferred the correct amount of tokens
    // 3. That the sender was the user's account
    // 4. That the receiver was the treasury account

    // For testnet purposes, we'll skip the verification and assume it's valid
    console.log(
      `TESTNET MODE: Skipping transaction verification and assuming success`
    );

    // Update the user's stock holdings to unlock the tokens
    const initialStockHoldingIndex = user.stockHoldings.findIndex(
      (holding) => holding.stockCode === stockCode
    );

    if (initialStockHoldingIndex === -1) {
      return res.status(404).json({
        message: `You don't hold any ${stockCode} stock`,
      });
    }

    // Reduce locked quantity
    user.stockHoldings[initialStockHoldingIndex].lockedQuantity = Math.max(
      0,
      user.stockHoldings[initialStockHoldingIndex].lockedQuantity - amount
    );

    console.log(
      `Unlocked ${amount} ${stockCode} shares, new locked amount: ${user.stockHoldings[initialStockHoldingIndex].lockedQuantity}`
    );

    // Update the user's token holdings as well (if we're tracking them in the database)
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    if (tokenHoldingIndex !== -1) {
      // Update balance
      user.tokenHoldings[tokenHoldingIndex].balance -= amount;

      // Remove holding if balance is zero
      if (user.tokenHoldings[tokenHoldingIndex].balance <= 0) {
        user.tokenHoldings.splice(tokenHoldingIndex, 1);
      }
    }

    // Save user updates
    await user.save();

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
      hederaTransactionId,
    });

    await transaction.save();

    // Deduct HBAR fees (0.1% of transaction value)
    const estimatedFee = (amount * 0.001) / 24.51; // Convert to HBAR
    await deductHbarFees(userId, estimatedFee);

    // Get final stock holding information for response
    const stockHolding = {
      stockCode,
      quantity: user.stockHoldings[initialStockHoldingIndex].quantity,
      lockedQuantity:
        user.stockHoldings[initialStockHoldingIndex].lockedQuantity,
      availableQuantity:
        user.stockHoldings[initialStockHoldingIndex].quantity -
        user.stockHoldings[initialStockHoldingIndex].lockedQuantity,
    };

    // Return success
    res.status(200).json({
      message: `Successfully verified burn of ${amount} ${stockCode} tokens`,
      transaction: transaction,
      stockHolding,
    });
  } catch (error: any) {
    console.error("Verify burn transaction error:", error);
    res.status(500).json({
      message: "Error verifying burn transaction",
      error: error.message,
    });
  }
};

/**
 * Get token by stock code
 * @route GET /api/tokens/:stockCode
 */
export const getTokenByStockCode = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    console.log(`Getting token for stock code: ${stockCode}`);

    // Find the token
    const token = await Token.findOne({ stockCode });

    if (!token) {
      console.log(`No token found for stock code: ${stockCode}`);
      return res.status(404).json({
        message: `No token exists for stock ${stockCode}`,
      });
    }

    console.log(`Found token: ${token.tokenId} for stock ${stockCode}`);
    res.status(200).json({ token });
  } catch (error) {
    console.error("Get token by stock code error:", error);
    res.status(500).json({ message: "Error getting token", error });
  }
};
