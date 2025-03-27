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
} from "@hashgraph/sdk";
import getClient from "../config/hedera";
import Token from "../models/Token";
import { IToken } from "../models/Token";
import dotenv from "dotenv";

dotenv.config();

// Check if we're in development mode with no Hedera credentials
const isDevelopmentMockMode =
  process.env.NODE_ENV === "development" &&
  (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY);

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

      // Get the operator account ID and private key from .env
      const treasuryId = isDevelopmentMockMode
        ? "0.0.12345"
        : AccountId.fromString(process.env.HEDERA_OPERATOR_ID!).toString();

      let tokenId = "";

      if (isDevelopmentMockMode) {
        console.log(`[DEV MOCK] Creating token for stock ${stockCode}`);
        // Generate a mock token ID for development
        tokenId = `0.0.${Math.floor(100000 + Math.random() * 900000)}`;
        console.log(`[DEV MOCK] Token created with ID: ${tokenId}`);
      } else {
        // Normal Hedera token creation
        console.log(`Creating token for stock ${stockCode}`);

        const operatorKey = PrivateKey.fromStringECDSA(
          process.env.HEDERA_OPERATOR_KEY!
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
      if (isDevelopmentMockMode) {
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

      if (isDevelopmentMockMode) {
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

      const client = getClient();
      const operatorKey = PrivateKey.fromStringECDSA(
        process.env.HEDERA_OPERATOR_KEY!
      );

      // Create mint transaction
      const transaction = new TokenMintTransaction()
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
      token.totalSupply += amount;
      token.circulatingSupply += amount;
      await token.save();

      // If receiver is specified and different from treasury, transfer the tokens
      if (receiverAccountId && receiverAccountId !== token.treasuryAccountId) {
        // Transfer the tokens to the receiver
        await this.transferTokens(
          tokenId,
          token.treasuryAccountId,
          receiverAccountId,
          amount,
          process.env.HEDERA_OPERATOR_KEY!
        );
      }

      return receipt;
    } catch (error) {
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

      if (isDevelopmentMockMode) {
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
      const operatorKey = PrivateKey.fromStringECDSA(
        process.env.HEDERA_OPERATOR_KEY!
      );

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
      if (isDevelopmentMockMode) {
        console.log(
          `[DEV MOCK] Associating token ${tokenId} with account ${accountId}`
        );
        return {
          status: "SUCCESS",
          tokenId: tokenId,
          accountId: accountId,
        };
      }

      const client = getClient();
      let privateKeyObj;

      try {
        // Handle different private key formats
        if (privateKey.startsWith("302e")) {
          privateKeyObj = PrivateKey.fromString(privateKey);
        } else if (privateKey.startsWith("0x")) {
          privateKeyObj = PrivateKey.fromStringECDSA(privateKey);
        } else {
          privateKeyObj = PrivateKey.fromStringECDSA(`0x${privateKey}`);
        }
      } catch (error) {
        console.error("Error parsing private key:", error);
        throw new Error("Invalid private key format");
      }

      // Create token associate transaction
      const transaction = await new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(client)
        .sign(privateKeyObj);

      // Submit the transaction to the Hedera network
      const txResponse = await transaction.execute(client);

      // Get the receipt
      const receipt = await txResponse.getReceipt(client);

      return receipt;
    } catch (error) {
      console.error("Error associating token:", error);
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
      if (isDevelopmentMockMode) {
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

      const client = getClient();
      let privateKeyObj;

      try {
        // Handle different private key formats
        if (senderPrivateKey.startsWith("302e")) {
          privateKeyObj = PrivateKey.fromString(senderPrivateKey);
        } else if (senderPrivateKey.startsWith("0x")) {
          privateKeyObj = PrivateKey.fromStringECDSA(senderPrivateKey);
        } else {
          privateKeyObj = PrivateKey.fromStringECDSA(`0x${senderPrivateKey}`);
        }
      } catch (error) {
        console.error("Error parsing private key:", error);
        throw new Error("Invalid private key format");
      }

      // Create transfer transaction
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
        .freezeWith(client)
        .sign(privateKeyObj);

      // Submit the transaction to the Hedera network
      const txResponse = await transaction.execute(client);

      // Get the receipt
      const receipt = await txResponse.getReceipt(client);

      return receipt;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  }
}

export default new TokenService();
