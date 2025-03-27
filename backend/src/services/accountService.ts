import {
  AccountCreateTransaction,
  AccountBalanceQuery,
  Hbar,
  PrivateKey,
  AccountId,
  AccountInfoQuery,
  TransferTransaction,
  TokenId,
} from "@hashgraph/sdk";
import getClient, {
  isDevelopmentMockMode,
  OPERATOR_ID,
  OPERATOR_KEY,
} from "../config/hedera";
import tokenService from "./tokenService";
import Token from "../models/Token";
import User from "../models/User";

/**
 * Service for interacting with Hedera Account Service
 */
class AccountService {
  /**
   * Create a new Hedera account
   * @param initialBalance Initial balance in HBAR
   * @returns Object containing account ID and private key
   */
  async createAccount(
    initialBalance = 0.1
  ): Promise<{ accountId: string; privateKey: string }> {
    try {
      if (isDevelopmentMockMode()) {
        console.log("[DEV MOCK] Creating mock Hedera account");

        // Generate mock account details for development
        const privateKey = PrivateKey.generateECDSA();

        return {
          accountId: `0.0.${Math.floor(100000 + Math.random() * 900000)}`,
          privateKey: privateKey.toStringDer(),
        };
      }

      const client = getClient();

      // Generate a new ECDSA key pair (compatible with EVM)
      const newKey = PrivateKey.generateECDSA();
      const newPublicKey = newKey.publicKey;

      console.log("Creating new Hedera account...");

      try {
        // Create a new account with an initial balance and alias it with the EVM address
        const transaction = new AccountCreateTransaction()
          .setKey(newPublicKey)
          .setInitialBalance(new Hbar(initialBalance))
          .setAlias(newPublicKey.toEvmAddress());

        // Submit the transaction to the Hedera network
        const txResponse = await transaction.execute(client);

        // Get the receipt
        const receipt = await txResponse.getReceipt(client);

        // Get the new account ID
        const accountId = receipt.accountId!.toString();

        console.log(`New account created: ${accountId}`);

        return {
          accountId,
          privateKey: newKey.toStringDer(),
        };
      } catch (error) {
        console.error(
          "Hedera account creation failed, using mock account:",
          error
        );

        // Fallback to mock account if there's an error
        return {
          accountId: `0.0.${Math.floor(100000 + Math.random() * 900000)}`,
          privateKey: newKey.toStringDer(),
        };
      }
    } catch (error) {
      console.error("Error creating Hedera account:", error);
      throw error;
    }
  }

  /**
   * Get account balance
   * @param accountId Account ID to query
   * @returns Account balance information
   */
  async getAccountBalance(accountId: string): Promise<any> {
    try {
      const client = getClient();

      const query = new AccountBalanceQuery().setAccountId(
        AccountId.fromString(accountId)
      );

      const accountBalance = await query.execute(client);

      return accountBalance;
    } catch (error) {
      console.error("Error getting account balance:", error);
      throw error;
    }
  }

  /**
   * Get account information
   * @param accountId Account ID to query
   * @returns Account information
   */
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      const client = getClient();

      const query = new AccountInfoQuery().setAccountId(
        AccountId.fromString(accountId)
      );

      const accountInfo = await query.execute(client);

      return accountInfo;
    } catch (error) {
      console.error("Error getting account info:", error);
      throw error;
    }
  }

  /**
   * Associate all available tokens with a user's Hedera account
   * @param userId MongoDB user ID
   * @returns Array of association results
   */
  async associateAllTokensWithUser(userId: string): Promise<any[]> {
    try {
      // Get user details
      const user = await User.findById(userId);
      if (!user || !user.hederaAccountId) {
        throw new Error("User not found or has no Hedera account");
      }

      // Get all tokens from database
      const tokens = await Token.find({});
      if (!tokens.length) {
        return [];
      }

      // Use hardcoded operator key for associations
      const operatorKey = OPERATOR_KEY;

      // Associate each token with the user's account
      const results = [];
      for (const token of tokens) {
        try {
          const result = await tokenService.associateTokenToAccount(
            token.tokenId,
            user.hederaAccountId,
            operatorKey
          );

          results.push({
            tokenId: token.tokenId,
            symbol: token.symbol,
            success: true,
            result,
          });
        } catch (error: any) {
          console.error(`Error associating token ${token.symbol}:`, error);

          // If the error contains "TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT" we consider it a success
          if (
            error.message &&
            error.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")
          ) {
            results.push({
              tokenId: token.tokenId,
              symbol: token.symbol,
              success: true,
              alreadyAssociated: true,
            });
          } else {
            results.push({
              tokenId: token.tokenId,
              symbol: token.symbol,
              success: false,
              error: error.message,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Error associating tokens with user:", error);
      throw error;
    }
  }

  /**
   * Transfer HBAR to another account
   * @param recipientId Recipient account ID
   * @param amount Amount to transfer in HBAR
   * @returns Transaction response
   */
  async transferHbar(recipientId: string, amount: number): Promise<any> {
    try {
      if (isDevelopmentMockMode()) {
        console.log(`[DEV MOCK] Transferring ${amount} HBAR to ${recipientId}`);
        return {
          status: "SUCCESS",
          transactionId: `mock-tx-${Date.now()}`,
        };
      }

      const client = getClient();

      // Create transfer transaction
      const transaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(OPERATOR_ID), new Hbar(-amount))
        .addHbarTransfer(AccountId.fromString(recipientId), new Hbar(amount))
        .freezeWith(client);

      let operatorKey;
      try {
        operatorKey = PrivateKey.fromString(OPERATOR_KEY);
      } catch (e1) {
        try {
          operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
        } catch (e2) {
          try {
            operatorKey = PrivateKey.fromStringECDSA(`0x${OPERATOR_KEY}`);
          } catch (e3) {
            throw new Error("Could not parse operator key for HBAR transfer");
          }
        }
      }

      // Sign the transaction
      const signedTx = await transaction.sign(operatorKey);

      // Submit the transaction
      const txResponse = await signedTx.execute(client);

      // Get the receipt
      const receipt = await txResponse.getReceipt(client);

      console.log(`HBAR transfer status: ${receipt.status.toString()}`);
      return receipt;
    } catch (error) {
      console.error("Error transferring HBAR:", error);
      throw error;
    }
  }
}

export default new AccountService();
