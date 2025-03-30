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
