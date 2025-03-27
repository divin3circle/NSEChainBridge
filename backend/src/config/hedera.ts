import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Hard-coded testnet credentials (for development only)
const TESTNET_OPERATOR_ID = "0.0.5483001";
const TESTNET_OPERATOR_KEY =
  "0xa21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0";

// Define mock client for development environment
const MockHederaClient = {
  setOperator: () => {},
  transferHbar: async () => ({
    execute: async () => ({
      getReceipt: async () => ({
        status: "SUCCESS",
        transactionId: "mock-transaction-id",
      }),
    }),
  }),
  // Mock for account creation
  execute: async () => ({
    getReceipt: async () => ({
      status: "SUCCESS",
      accountId: { toString: () => "0.0.12345" },
    }),
  }),
} as any;

/**
 * Create a Hedera client for the specified network
 * @returns Configured Hedera client
 */
const getClient = () => {
  // Set isDevelopmentMockMode based on environment
  const isTestnet = process.env.NODE_ENV === "testnet";
  const isDevelopmentMockMode =
    !isTestnet &&
    process.env.NODE_ENV === "development" &&
    (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY);

  console.log(
    `NODE_ENV=${process.env.NODE_ENV}, isTestnet=${isTestnet}, isDevelopmentMockMode=${isDevelopmentMockMode}`
  );

  // For testnet environment, use hardcoded credentials
  if (isTestnet) {
    console.log("Using hardcoded testnet credentials");

    // Format the operator ID and key
    const operatorId = AccountId.fromString(TESTNET_OPERATOR_ID);
    // Use fromStringECDSA for hex format keys
    const operatorKey = PrivateKey.fromStringECDSA(TESTNET_OPERATOR_KEY);

    // Configure client for testnet
    const client = Client.forTestnet();
    console.log(
      "Connecting to Hedera testnet with account:",
      TESTNET_OPERATOR_ID
    );

    // Set the operator of the client
    client.setOperator(operatorId, operatorKey);
    return client;
  }

  // Check if the environment variables are set
  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    if (isDevelopmentMockMode) {
      console.warn(
        "WARNING: Hedera credentials not set. Using mock client for development."
      );
      // Return a more complete mock client for development
      return MockHederaClient;
    } else {
      throw new Error("Hedera credentials not set in environment variables.");
    }
  }

  // Format the operator ID and key
  const operatorId = AccountId.fromString(
    process.env.HEDERA_OPERATOR_ID as string
  );
  const operatorKey = PrivateKey.fromString(
    process.env.HEDERA_OPERATOR_KEY as string
  );

  // Configure client based on network (mainnet vs testnet)
  let client;
  // We already handled testnet with hardcoded credentials above
  client = Client.forMainnet();
  console.log("Connecting to Hedera mainnet");

  // Set the operator of the client
  client.setOperator(operatorId, operatorKey);
  return client;
};

export default getClient;
