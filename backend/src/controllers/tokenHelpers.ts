import User from "../models/User";
import tokenService from "../services/tokenService";

/**
 * Get user's token balance for a specific stock
 * @param userId User ID
 * @param stockCode Stock code
 * @returns Token balance
 */
export const getUserTokenBalance = async (
  userId: string,
  stockCode: string
): Promise<number> => {
  try {
    // Find token for this stock
    const token = await tokenService.getTokenByStockCode(stockCode);
    if (!token) {
      return 0;
    }

    // Find user and check token holdings
    const user = await User.findById(userId);
    if (!user) {
      return 0;
    }

    const tokenHolding = user.tokenHoldings.find(
      (holding) => holding.tokenId === token.tokenId
    );

    return tokenHolding ? tokenHolding.balance : 0;
  } catch (error) {
    console.error("Error getting user token balance:", error);
    return 0;
  }
};

/**
 * Update user's token balance
 * @param userId User ID
 * @param stockCode Stock code
 * @param amount Amount to add (positive) or subtract (negative)
 */
export const updateUserTokenBalance = async (
  userId: string,
  stockCode: string,
  amount: number
): Promise<void> => {
  try {
    // Find token for this stock
    const token = await tokenService.getTokenByStockCode(stockCode);
    if (!token) {
      throw new Error(`Token for stock ${stockCode} not found`);
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find token holding
    const tokenHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === token.tokenId
    );

    if (tokenHoldingIndex === -1) {
      if (amount > 0) {
        // Add new token holding if amount is positive
        user.tokenHoldings.push({
          tokenId: token.tokenId,
          balance: amount,
          lockedQuantity: 0,
        });
      } else {
        throw new Error(`User does not hold any ${stockCode} tokens`);
      }
    } else {
      // Update existing token holding
      const newBalance = user.tokenHoldings[tokenHoldingIndex].balance + amount;

      if (newBalance < 0) {
        throw new Error(`Insufficient ${stockCode} tokens`);
      }

      user.tokenHoldings[tokenHoldingIndex].balance = newBalance;

      // Remove token holding if balance is zero
      if (user.tokenHoldings[tokenHoldingIndex].balance === 0) {
        user.tokenHoldings.splice(tokenHoldingIndex, 1);
      }
    }

    await user.save();
  } catch (error) {
    console.error("Error updating user token balance:", error);
    throw error;
  }
};

/**
 * Deduct HBAR fees from user's token holdings
 * @param userId User ID
 * @param feeAmount Amount of HBAR to deduct for fees
 */
export const deductHbarFees = async (
  userId: string,
  feeAmount: number
): Promise<void> => {
  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Find HBAR token holding
    const hbarHoldingIndex = user.tokenHoldings.findIndex(
      (holding) => holding.tokenId === "HBAR"
    );

    if (hbarHoldingIndex === -1) {
      throw new Error("User does not hold any HBAR tokens");
    }

    // Update HBAR balance
    const newBalance = user.tokenHoldings[hbarHoldingIndex].balance - feeAmount;

    if (newBalance < 0) {
      throw new Error("Insufficient HBAR balance for fees");
    }

    user.tokenHoldings[hbarHoldingIndex].balance = newBalance;

    // Remove token holding if balance is zero
    if (user.tokenHoldings[hbarHoldingIndex].balance === 0) {
      user.tokenHoldings.splice(hbarHoldingIndex, 1);
    }

    await user.save();
  } catch (error) {
    console.error("Error deducting HBAR fees:", error);
    throw error;
  }
};

/**
 * Get actual transaction fees from Hedera network using Mirror Node API
 * @param transactionId Hedera transaction ID in format "0.0.5483001@1743355957.262204869"
 * @returns Actual fee in HBAR
 */
export const getTransactionFees = async (
  transactionId: string
): Promise<number> => {
  try {
    if (!transactionId) {
      console.error("No transaction ID provided");
      return 0; // Return 0 fee if no transaction ID
    }
    const [accountId, timestamp] = transactionId.split("@");
    const [seconds, nanoseconds] = timestamp.split(".");
    if (!accountId || !timestamp) {
      console.error("Invalid transaction ID format");
      return 0; // Return 0 fee if format is invalid
    }
    const formattedTxId = `${accountId}-${seconds}-${nanoseconds}`;
    console.log("Formatted transaction ID for API:", formattedTxId);

    console.log("Fetching fees for transaction:", formattedTxId);

    // Use Hedera Mirror Node REST API
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/transactions/${formattedTxId}`
    );

    if (!response.ok) {
      console.error(`Failed to fetch transaction: ${response.statusText}`);
      return 0; // Return 0 fee if API call fails
    }

    const data = await response.json();

    // Check if we have valid fee data in charged_tx_fee
    if (!data || !data.transactions) {
      console.error("Invalid transaction data received:", data);
      return 0;
    }

    const charged_tx_fee = data.transactions[0].charged_tx_fee;
    if (typeof charged_tx_fee !== "number") {
      console.error("Invalid charged_tx_fee:", charged_tx_fee);
      return 0;
    }
    const feeInHbar = charged_tx_fee / 100000000;
    console.log(
      `Transaction fee: ${feeInHbar} HBAR (${charged_tx_fee} tinybars)`
    );
    return feeInHbar;
  } catch (error) {
    console.error("Error getting transaction fees:", error);
    return 0; // Return 0 fee on any error
  }
};
