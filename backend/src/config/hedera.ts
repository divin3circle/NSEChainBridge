import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import dotenv from "dotenv";
import { Hbar } from "@hashgraph/sdk";

// Load environment variables (for other settings)
dotenv.config();

// IMPORTANT: Explicitly define the credentials used across the entire app
// For testnet, use the consistent account from createRealTokens.js
export const OPERATOR_ID = "0.0.5483001";
export const OPERATOR_KEY =
  "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0";
export const NETWORK = "testnet";

// Set this to false to use real tokens for testnet mode
export const USE_MOCK_TOKENS = false;

// Define more advanced mock client for development/testing
const MockHederaClient = {
  setOperator: () => {
    console.log("[MOCK] Setting operator for mock client");
  },
  transferHbar: async () => {
    console.log("[MOCK] Executing mock HBAR transfer");
    return {
      execute: async () => {
        console.log("[MOCK] Mock HBAR transfer executed");
        return {
          getReceipt: async () => {
            console.log("[MOCK] Getting receipt for mock HBAR transfer");
            return {
              status: "SUCCESS",
              transactionId: `mock-tx-${Date.now()}`,
            };
          },
        };
      },
    };
  },
  // Enhanced mock for token operations
  execute: async (transaction: any) => {
    // Check transaction type from toString() output
    const txType = transaction.toString();
    console.log(`[MOCK] Executing mock transaction: ${txType}`);

    if (txType.includes("TokenCreateTransaction")) {
      console.log("[MOCK] Creating mock token");
    } else if (txType.includes("TokenMintTransaction")) {
      console.log("[MOCK] Minting mock tokens");
    } else if (txType.includes("TokenBurnTransaction")) {
      console.log("[MOCK] Burning mock tokens");
    } else if (txType.includes("TokenAssociateTransaction")) {
      console.log("[MOCK] Associating mock token with account");
    } else if (txType.includes("TransferTransaction")) {
      console.log("[MOCK] Transferring mock tokens");
    } else if (txType.includes("AccountCreateTransaction")) {
      console.log("[MOCK] Creating mock account");
    }

    return {
      getReceipt: async () => {
        console.log("[MOCK] Getting mock transaction receipt");
        // For token creation, return a token ID
        if (txType.includes("TokenCreateTransaction")) {
          return {
            status: "SUCCESS",
            tokenId: {
              toString: () =>
                `0.0.${Math.floor(100000 + Math.random() * 900000)}`,
            },
            transactionId: `mock-tx-${Date.now()}`,
          };
        }
        // For account creation, return an account ID
        if (txType.includes("AccountCreateTransaction")) {
          return {
            status: "SUCCESS",
            accountId: {
              toString: () =>
                `0.0.${Math.floor(100000 + Math.random() * 900000)}`,
            },
            transactionId: `mock-tx-${Date.now()}`,
          };
        }
        return {
          status: "SUCCESS",
          transactionId: `mock-tx-${Date.now()}`,
        };
      },
    };
  },
} as any;

/**
 * Get whether we're in development mode with no Hedera credentials
 * or if we're using mock tokens for testnet development
 */
export const isDevelopmentMockMode = () => {
  // Using hardcoded setting instead of environment variables
  const isTestnet = process.env.NODE_ENV === "testnet";
  if (isTestnet) {
    return USE_MOCK_TOKENS;
  }

  // For development mode, always use mock if no credentials
  const isDevelopmentNoCredentials =
    process.env.NODE_ENV === "development" && (!OPERATOR_ID || !OPERATOR_KEY);

  return isDevelopmentNoCredentials;
};

/**
 * Create a Hedera client for the specified network
 * @returns Configured Hedera client
 */
const getClient = () => {
  // Set isDevelopmentMockMode based on environment
  const isTestnet = process.env.NODE_ENV === "testnet";
  const isUsingMockTokens = isDevelopmentMockMode();

  console.log(
    `NODE_ENV=${process.env.NODE_ENV}, isTestnet=${isTestnet}, isDevelopmentMockMode=${isUsingMockTokens}, USE_MOCK_TOKENS=${USE_MOCK_TOKENS}`
  );
  console.log(
    `Using hard-coded credentials: OPERATOR_ID=${OPERATOR_ID}, OPERATOR_KEY=${OPERATOR_KEY.substring(
      0,
      4
    )}...`
  );

  // For testnet environment
  if (isTestnet) {
    try {
      // Always use our hardcoded values
      const operatorIdStr = OPERATOR_ID;
      const operatorKeyStr = OPERATOR_KEY;

      console.log(`Using account ID: ${operatorIdStr} for testnet`);

      // If using mock tokens, return a hybrid client that can do basic operations
      // but uses mock functions for token operations
      if (isUsingMockTokens) {
        console.log("Using mock client for testnet operations");
        return MockHederaClient;
      }

      // Format the operator ID
      const operatorId = AccountId.fromString(operatorIdStr);

      // Parse private key - ALWAYS use ECDSA format for consistency
      console.log("Parsing private key using ECDSA format...");
      const operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);
      console.log("Successfully parsed key using fromStringECDSA");

      // Create the key and print its type
      console.log(`Operator Key Type: ${operatorKey.constructor.name}`);
      console.log(
        `Public key: ${operatorKey.publicKey.toString().substring(0, 15)}...`
      );

      // Configure client for testnet
      const client = Client.forTestnet();
      console.log(
        `Connecting to Hedera testnet with account: ${operatorIdStr}`
      );

      // Set the operator of the client
      client.setOperator(operatorId, operatorKey);

      // Configure max transaction fee
      console.log("Setting max transaction fee to 10 HBAR");
      client.setMaxTransactionFee(new Hbar(10));

      // Overriding execute method to add logging
      const clientAny = client as any;
      const originalExecute = clientAny.execute;
      if (originalExecute) {
        clientAny.execute = async function (...args: any[]) {
          console.log(
            `Executing transaction of type: ${
              args[0]?.constructor?.name || "Unknown"
            }`
          );
          try {
            const result = await originalExecute.apply(this, args);
            console.log("Transaction executed successfully");
            return result;
          } catch (err) {
            console.error(`Transaction execution failed: ${err}`);
            throw err;
          }
        };
      }

      return client;
    } catch (error) {
      console.error("Error initializing Hedera testnet client:", error);
      throw error;
    }
  }

  // For non-testnet environment use mainnet
  console.log("Creating mainnet client with hardcoded credentials");

  // Format the operator ID and key - ALWAYS use ECDSA format for consistency
  const operatorId = AccountId.fromString(OPERATOR_ID);
  const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
  console.log("Successfully parsed key for mainnet using fromStringECDSA");

  // Configure client for mainnet
  const client = Client.forMainnet();
  console.log("Connecting to Hedera mainnet");

  // Set the operator of the client
  client.setOperator(operatorId, operatorKey);
  return client;
};

export default getClient;
