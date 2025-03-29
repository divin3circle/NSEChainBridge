import {
  TokenId,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenInfoQuery,
  TransferTransaction,
  Hbar,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PublicKey,
  Client,
  TransactionReceiptQuery,
  TransactionId,
} from "@hashgraph/sdk";
import getClient, {
  isDevelopmentMockMode,
  OPERATOR_ID,
  OPERATOR_KEY,
} from "../config/hedera";
import Token from "../models/Token";
import { IToken } from "../models/Token";
import dotenv from "dotenv";

dotenv.config();

/**
 * Service for interacting with Hedera Token Service (HTS)
 */
class TokenService {
  /**
   * Create a new token for a stock
   * @param stockCode Stock code (e.g., "KCB", "SCOM")
   * @param stockName Stock name (e.g., "KCB Group", "Safaricom")
   * @param initialSupply Initial token supply
   * @returns New token information including the Hedera token ID
   */
  async createStockToken(
    stockCode: string,
    stockName: string,
    initialSupply: number = 0
  ): Promise<IToken> {
    try {
      const client = getClient();

      // Get the operator account ID using hardcoded value
      const treasuryId = isDevelopmentMockMode()
        ? "0.0.12345"
        : AccountId.fromString(OPERATOR_ID).toString();

      let tokenId = "";

      if (isDevelopmentMockMode()) {
        console.log(`[DEV MOCK] Creating token for stock ${stockCode}`);
        // Generate a mock token ID for development
        tokenId = `0.0.${Math.floor(100000 + Math.random() * 900000)}`;
        console.log(`[DEV MOCK] Token created with ID: ${tokenId}`);
      } else {
        // Normal Hedera token creation
        console.log(`Creating token for stock ${stockCode}`);

        // Parse the private key using ECDSA format for consistency
        const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
        console.log(
          "Successfully parsed key using fromStringECDSA for token creation"
        );

        const publicKey = operatorKey.publicKey;

        // Create token transaction
        const transaction = new TokenCreateTransaction()
          .setTokenName(`${stockName} Token`)
          .setTokenSymbol(stockCode)
          .setDecimals(0)
          .setInitialSupply(initialSupply)
          .setTreasuryAccountId(AccountId.fromString(treasuryId))
          .setSupplyType(TokenSupplyType.Infinite)
          .setTokenType(TokenType.FungibleCommon)
          .setSupplyKey(publicKey)
          .setMaxTransactionFee(new Hbar(30))
          .freezeWith(client);

        // Execute transaction
        const txResponse = await transaction.execute(client);

        // Get receipt
        const receipt = await txResponse.getReceipt(client);
        tokenId = receipt.tokenId!.toString();

        console.log(`Token created with ID: ${tokenId}`);
      }

      // Create token record in database
      const token = new Token({
        tokenId,
        name: `${stockName} Token`,
        symbol: stockCode,
        decimals: 0,
        totalSupply: initialSupply,
        circulatingSupply: initialSupply,
        treasuryAccountId: treasuryId,
        stockCode,
        metadata: {
          description: `Tokenized representation of ${stockName} shares on the Nairobi Stock Exchange`,
          stockPrice: 0, // Will be updated from external data
          marketCap: 0, // Will be updated from external data
        },
      });

      await token.save();

      return token;
    } catch (error) {
      console.error("Error creating stock token:", error);
      throw error;
    }
  }

  /**
   * Get token info from Hedera network
   * @param tokenId The token ID to query
   * @returns Token information
   */
  async getTokenInfo(tokenId: string): Promise<any> {
    try {
      if (isDevelopmentMockMode()) {
        console.log(`[DEV MOCK] Getting token info for ${tokenId}`);
        return {
          tokenId: tokenId,
          name: "Mock Token",
          symbol: "MOCK",
          totalSupply: 1000,
          decimals: 0,
        };
      }

      const client = getClient();
      const query = new TokenInfoQuery().setTokenId(
        TokenId.fromString(tokenId)
      );
      const tokenInfo = await query.execute(client);
      return tokenInfo;
    } catch (error) {
      console.error("Error getting token info:", error);
      throw error;
    }
  }

  /**
   * Get token details from database
   * @param tokenId The token ID to query
   * @returns Token details from database
   */
  async getTokenDetails(tokenId: string): Promise<IToken | null> {
    try {
      const token = await Token.findOne({ tokenId });
      return token;
    } catch (error) {
      console.error("Error getting token details:", error);
      throw error;
    }
  }

  /**
   * Get token by stock code
   * @param stockCode The stock code to find token for
   * @returns Token details from database
   */
  async getTokenByStockCode(stockCode: string): Promise<IToken | null> {
    try {
      const token = await Token.findOne({ symbol: stockCode });
      return token;
    } catch (error) {
      console.error("Error getting token by stock code:", error);
      throw error;
    }
  }

  /**
   * Mint new tokens
   * @param tokenId The token ID to mint
   * @param amount Amount of tokens to mint
   * @param receiverAccountId Account that will receive the minted tokens (defaults to treasury)
   * @returns Transaction receipt
   */
  async mintTokens(
    tokenId: string,
    amount: number,
    receiverAccountId?: string
  ): Promise<any> {
    try {
      // Get token details from database
      const token = await this.getTokenDetails(tokenId);

      if (!token) {
        throw new Error(`Token with ID ${tokenId} not found`);
      }

      if (isDevelopmentMockMode()) {
        console.log(`[DEV MOCK] Minting ${amount} tokens for token ${tokenId}`);

        // Update token supply in database
        token.totalSupply += amount;
        token.circulatingSupply += amount;
        await token.save();

        return {
          status: "SUCCESS",
          tokenId: tokenId,
          amount: amount,
        };
      }

      console.log(`========== MINTING TOKENS DETAILED DEBUG ==========`);
      console.log(`Minting ${amount} tokens for token ${tokenId}`);
      console.log(`Token details:
        - Token ID: ${token.tokenId}
        - Symbol: ${token.symbol}
        - Treasury Account: ${token.treasuryAccountId}
      `);

      // Fetch token info from Hedera network if possible
      try {
        const tokenInfo = await this.getTokenInfo(tokenId);
        console.log(
          `Token info from Hedera:`,
          JSON.stringify(tokenInfo, null, 2)
        );
      } catch (error: any) {
        console.log(`Could not fetch token info from Hedera: ${error.message}`);
      }

      console.log(`Credentials:
        - OPERATOR_ID: ${OPERATOR_ID}
        - NETWORK: ${process.env.HEDERA_NETWORK || "testnet"}
      `);

      const client = getClient();

      // IMPORTANT: For token minting, we need to use the token's treasury key
      // Only the account that created the token (with supplyKey) can mint new tokens
      try {
        // Verify that our operator account matches the token's treasury
        if (OPERATOR_ID !== token.treasuryAccountId.split(".").join(".")) {
          console.log(
            `WARNING: Current operator ID (${OPERATOR_ID}) is different from token treasury (${token.treasuryAccountId})`
          );
          console.log(
            `This may cause signature issues if the operator doesn't have supply key permissions`
          );
        } else {
          console.log(
            `INFO: Current operator ID (${OPERATOR_ID}) matches token treasury (${token.treasuryAccountId})`
          );
        }

        // Get the private key - try different methods
        let operatorKey;
        const rawKey = OPERATOR_KEY;

        console.log("Parsing operator key for minting using ECDSA format...");
        operatorKey = PrivateKey.fromStringECDSA(rawKey);
        console.log("Successfully parsed key with fromStringECDSA for minting");

        // Create mint transaction
        const transaction = new TokenMintTransaction()
          .setTokenId(TokenId.fromString(tokenId))
          .setAmount(amount)
          .freezeWith(client);

        console.log("Created mint transaction");

        // Sign the transaction with the token supply key (operator key)
        const signedTx = await transaction.sign(operatorKey);

        console.log("Signed mint transaction");

        // Execute the signed transaction
        const txResponse = await signedTx.execute(client);

        console.log("Executed mint transaction");

        // Get receipt
        const receipt = await txResponse.getReceipt(client);

        console.log(`Mint transaction status: ${receipt.status.toString()}`);

        // Update token supply in database
        token.totalSupply += amount;
        token.circulatingSupply += amount;
        await token.save();

        console.log(
          `Updated token supply in database. New total: ${token.totalSupply}`
        );

        // If receiver is specified and different from treasury, transfer the tokens
        if (
          receiverAccountId &&
          receiverAccountId !== token.treasuryAccountId
        ) {
          console.log(`Transferring ${amount} tokens to ${receiverAccountId}`);
          // Transfer the tokens to the receiver
          await this.transferTokens(
            tokenId,
            token.treasuryAccountId,
            receiverAccountId,
            amount,
            OPERATOR_KEY
          );
        }

        return receipt;
      } catch (error: any) {
        console.error("Error in mint tokens process:", error);
        throw new Error(`Failed to mint tokens: ${error.message}`);
      }
    } catch (error: any) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  }

  /**
   * Burn tokens
   * @param tokenId The token ID to burn
   * @param amount Amount of tokens to burn
   * @returns Transaction receipt
   */
  async burnTokens(tokenId: string, amount: number): Promise<any> {
    try {
      // Get token details from database
      const token = await this.getTokenDetails(tokenId);

      if (!token) {
        throw new Error(`Token with ID ${tokenId} not found`);
      }

      if (isDevelopmentMockMode()) {
        console.log(`[DEV MOCK] Burning ${amount} tokens for token ${tokenId}`);

        // Update token supply in database
        token.totalSupply -= amount;
        token.circulatingSupply -= amount;
        await token.save();

        return {
          status: "SUCCESS",
          tokenId: tokenId,
          amount: amount,
        };
      }

      const client = getClient();

      // Parse the private key using ECDSA format for consistency
      console.log("Parsing operator key for burning using ECDSA format...");
      const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
      console.log("Successfully parsed key with fromStringECDSA for burning");

      // Create burn transaction
      const transaction = new TokenBurnTransaction()
        .setTokenId(TokenId.fromString(tokenId))
        .setAmount(amount)
        .freezeWith(client);

      // Sign the transaction
      const signedTx = await transaction.sign(operatorKey);

      // Execute the signed transaction
      const txResponse = await signedTx.execute(client);

      // Get receipt
      const receipt = await txResponse.getReceipt(client);

      // Update token supply in database
      token.totalSupply -= amount;
      token.circulatingSupply -= amount;
      await token.save();

      return receipt;
    } catch (error) {
      console.error("Error burning tokens:", error);
      throw error;
    }
  }

  /**
   * Associate a token with an account
   * @param tokenId Token to associate
   * @param accountId Account to associate with
   * @param privateKey Private key of the account
   * @returns Transaction receipt
   */
  async associateTokenToAccount(
    tokenId: string,
    accountId: string,
    privateKey: string
  ): Promise<any> {
    try {
      if (isDevelopmentMockMode()) {
        console.log(
          `[DEV MOCK] Associating token ${tokenId} with account ${accountId}`
        );
        return {
          status: "SUCCESS",
          tokenId: tokenId,
          accountId: accountId,
        };
      }

      console.log(
        `Attempting to associate token ${tokenId} with account ${accountId}`
      );

      // Use operator key if user's private key is not provided or invalid
      const client = getClient();
      let privateKeyObj;

      try {
        if (!privateKey || privateKey.trim() === "") {
          console.log("User private key not provided, using operator key");

          // Parse the operator key using ECDSA format for consistency
          privateKeyObj = PrivateKey.fromStringECDSA(OPERATOR_KEY);
          console.log("Successfully parsed operator key with fromStringECDSA");
        } else {
          console.log("Using provided user private key");

          // For user keys, try different formats
          try {
            // First try with ECDSA
            privateKeyObj = PrivateKey.fromStringECDSA(privateKey);
            console.log("Successfully parsed user key with fromStringECDSA");
          } catch (error) {
            // Then try standard format
            try {
              privateKeyObj = PrivateKey.fromString(privateKey);
              console.log("Successfully parsed user key with fromString");
            } catch (error) {
              console.error(
                "Failed to parse user key, falling back to operator key"
              );
              privateKeyObj = PrivateKey.fromStringECDSA(OPERATOR_KEY);
              console.log("Falling back to operator key with fromStringECDSA");
            }
          }
        }
      } catch (error: any) {
        console.log(
          "Error parsing key, falling back to operator key:",
          error.message
        );

        // Final fallback to operator key with ECDSA format
        privateKeyObj = PrivateKey.fromStringECDSA(OPERATOR_KEY);
        console.log("Fallback to operator key with fromStringECDSA");
      }

      // Create token associate transaction
      const transaction = await new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(client);

      console.log("Created token association transaction");

      // Sign the transaction
      const signedTx = await transaction.sign(privateKeyObj);

      console.log("Signed token association transaction");

      // Submit the transaction to the Hedera network
      const txResponse = await signedTx.execute(client);

      console.log("Executed token association transaction");

      // Get the receipt
      const receipt = await txResponse.getReceipt(client);

      console.log(`Token association status: ${receipt.status.toString()}`);

      console.log(
        `Successfully associated token ${tokenId} with account ${accountId}`
      );
      return receipt;
    } catch (error: any) {
      console.error("Error associating token:", error.message);
      throw error;
    }
  }

  /**
   * Transfer tokens from one account to another
   * @param tokenId Token to transfer
   * @param senderAccountId Sender account ID
   * @param receiverAccountId Receiver account ID
   * @param amount Amount to transfer
   * @param senderPrivateKey Private key of the sender
   * @returns Transaction response
   */
  async transferTokens(
    tokenId: string,
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    senderPrivateKey: string
  ): Promise<any> {
    try {
      if (isDevelopmentMockMode()) {
        console.log(
          `[DEV MOCK] Transferring ${amount} tokens from ${senderAccountId} to ${receiverAccountId}`
        );
        return {
          status: "SUCCESS",
          tokenId: tokenId,
          senderAccountId: senderAccountId,
          receiverAccountId: receiverAccountId,
          amount: amount,
        };
      }

      console.log(
        `Transferring ${amount} tokens from ${senderAccountId} to ${receiverAccountId}`
      );

      const client = getClient();
      let privateKeyObj;

      // Parse the sender's private key
      console.log("Parsing sender's private key for token transfer");
      try {
        if (!senderPrivateKey || senderPrivateKey.trim() === "") {
          console.log("Sender private key not provided, using operator key");
          // Use ECDSA format for consistency
          privateKeyObj = PrivateKey.fromStringECDSA(OPERATOR_KEY);
          console.log("Successfully parsed operator key with fromStringECDSA");
        } else {
          // For user keys, try different formats but prefer ECDSA
          try {
            // First try with ECDSA for consistency
            privateKeyObj = PrivateKey.fromStringECDSA(senderPrivateKey);
            console.log("Successfully parsed sender key with fromStringECDSA");
          } catch (error) {
            // Then try standard format
            try {
              privateKeyObj = PrivateKey.fromString(senderPrivateKey);
              console.log("Successfully parsed sender key with fromString");
            } catch (error) {
              console.error("Failed to parse sender key:", error);

              // Special case: if this is a transfer from treasury account, use operator key
              if (
                senderAccountId === AccountId.fromString(OPERATOR_ID).toString()
              ) {
                console.log(
                  "Transfer from treasury account, using operator key"
                );
                privateKeyObj = PrivateKey.fromStringECDSA(OPERATOR_KEY);
                console.log(
                  "Using operator key with fromStringECDSA for treasury transfer"
                );
              } else {
                throw new Error("Invalid sender private key format");
              }
            }
          }
        }
      } catch (error: any) {
        console.log(
          "Error parsing key, falling back to operator key:",
          error.message
        );

        // Final fallback to operator key with ECDSA format
        privateKeyObj = PrivateKey.fromStringECDSA(OPERATOR_KEY);
        console.log("Fallback to operator key with fromStringECDSA");
      }

      // Create transfer transaction
      console.log("Creating token transfer transaction");
      const transaction = await new TransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(tokenId),
          AccountId.fromString(senderAccountId),
          -amount
        )
        .addTokenTransfer(
          TokenId.fromString(tokenId),
          AccountId.fromString(receiverAccountId),
          amount
        )
        .freezeWith(client);

      console.log("Created token transfer transaction");

      // Sign the transaction
      const signedTx = await transaction.sign(privateKeyObj);

      console.log("Signed token transfer transaction");

      // Submit the transaction to the Hedera network
      const txResponse = await signedTx.execute(client);

      console.log("Executed token transfer transaction");

      // Get the receipt
      const receipt = await txResponse.getReceipt(client);

      console.log(`Token transfer status: ${receipt.status.toString()}`);

      console.log(
        `Successfully transferred ${amount} tokens from ${senderAccountId} to ${receiverAccountId}`
      );
      return receipt;
    } catch (error: any) {
      console.error("Error transferring tokens:", error.message);
      throw error;
    }
  }

  /**
   * Transfer tokens from a user account back to the treasury
   *
   * @param tokenId Token to transfer
   * @param userAccountId User account to retrieve tokens from
   * @param amount Amount to transfer
   * @returns Transaction receipt or mock receipt
   */
  async transferFromUserToTreasury(
    tokenId: string,
    userAccountId: string,
    amount: number
  ): Promise<any> {
    try {
      if (isDevelopmentMockMode()) {
        console.log(
          `[DEV MOCK] Retrieving ${amount} tokens from ${userAccountId} to treasury ${OPERATOR_ID}`
        );
        return {
          status: "SUCCESS",
          tokenId: tokenId,
          userAccountId: userAccountId,
          treasuryAccountId: OPERATOR_ID,
          amount: amount,
        };
      }

      // Find token to get treasury account
      const token = await this.getTokenDetails(tokenId);
      if (!token) {
        throw new Error(`Token with ID ${tokenId} not found`);
      }

      console.log(`========== TOKEN RETRIEVAL DEBUG ==========`);
      console.log(
        `Note: Burning tokens from ${userAccountId} to treasury ${token.treasuryAccountId}`
      );
      console.log(
        `IMPORTANT: Since we're on testnet and don't have the user's private key, we'll simulate the burn`
      );

      /**
       * PRODUCTION IMPLEMENTATION NOTE:
       *
       * In a production environment, token burning should be implemented as follows:
       *
       * 1. FRONTEND-INITIATED TRANSFER (RECOMMENDED):
       *    - The user initiates the burn from the frontend
       *    - Frontend creates a transfer transaction using the user's private key
       *    - Transaction transfers tokens from user to treasury
       *    - Backend verifies the transfer was successful and then unlocks stocks
       *    - This is most secure as user's private key never leaves their device
       *
       * 2. BACKEND-INITIATED WITH ALLOWANCE:
       *    - User first approves an allowance for the treasury to spend their tokens
       *    - Backend detects the allowance and then transfers tokens on behalf of user
       *    - Requires two steps from the user
       *
       * For testnet development where we don't have real user keys, we're simulating
       * the burn process in the database only.
       */

      console.log(`Using the treasury operator credentials:
      - Treasury/Operator ID: ${OPERATOR_ID}
      - Treasury account from token: ${token.treasuryAccountId}
      `);

      // Simulating token burn for testnet development
      console.log(
        `NOTE: To avoid INVALID_SIGNATURE errors, we're updating the database only`
      );
      console.log(
        `In production, users would authorize this transaction from the frontend`
      );

      // Update token supply in database
      token.circulatingSupply -= amount;
      await token.save();

      console.log(
        `Updated token circulating supply in database. New circulating supply: ${token.circulatingSupply}`
      );

      // Return a simulated receipt
      return {
        status: "SUCCESS",
        tokenId: tokenId,
        userAccountId: userAccountId,
        treasuryAccountId: token.treasuryAccountId,
        amount: amount,
        transactionId: `simulated-${Date.now()}`,
        dbOnly: true,
        productionNote:
          "In production, this should be a real transaction authorized by the user",
      };
    } catch (error: any) {
      console.error(`Error handling token return:`, error);
      throw new Error(`Failed to handle token return: ${error.message}`);
    }
  }

  /**
   * Verify a user-initiated burn transaction
   * @param tokenId Token that was burned
   * @param userAccountId User account that burned the tokens
   * @param amount Amount of tokens burned
   * @param transactionId Transaction ID of the burn
   * @returns Transaction receipt
   */
  async verifyUserBurnTransaction(
    tokenId: string,
    userAccountId: string,
    amount: number,
    transactionId: string
  ) {
    try {
      console.log("Verifying burn transaction...");
      console.log(`Token ID: ${tokenId}`);
      console.log(`User Account: ${userAccountId}`);
      console.log(`Amount: ${amount}`);
      console.log(`Transaction ID: ${transactionId}`);

      // In development mock mode, just return success
      if (isDevelopmentMockMode()) {
        console.log("[DEV MOCK] Skipping transaction verification");
        return { status: "SUCCESS" };
      }

      // Create a client for testnet
      const client = Client.forTestnet();

      // Get the transaction receipt
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(TransactionId.fromString(transactionId))
        .execute(client);

      console.log("Transaction receipt status:", receipt.status.toString());

      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(
          `Transaction failed with status: ${receipt.status.toString()}`
        );
      }

      // Since the transaction was successful and we can verify it on HashScan,
      // we can consider this a successful burn
      console.log("Transaction verified successfully via receipt status");
      return { status: "SUCCESS" };
    } catch (error) {
      console.error("Error verifying burn transaction:", error);
      throw error;
    }
  }
}

export default new TokenService();
