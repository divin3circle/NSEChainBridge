import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure required environment variables are set
if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
  throw new Error(
    "Environment variables HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set"
  );
}

// Parse private key based on its format
const parsePrivateKey = (keyString: string): PrivateKey => {
  try {
    if (keyString.startsWith("302e02")) {
      // DER format
      return PrivateKey.fromString(keyString);
    } else if (keyString.startsWith("0x")) {
      // EVM format key (0x prefix)
      return PrivateKey.fromStringECDSA(keyString);
    } else {
      // Try raw hex format
      return PrivateKey.fromStringECDSA(`0x${keyString}`);
    }
  } catch (error) {
    console.error("Error parsing private key:", error);
    throw error;
  }
};

// Configure Hedera client
const getClient = (): Client => {
  try {
    // Get operator from .env file
    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = parsePrivateKey(process.env.HEDERA_OPERATOR_KEY!);

    console.log(
      `Creating Hedera client with account: ${operatorId.toString()}`
    );

    // Create and configure client based on network from .env
    let client: Client;

    switch (process.env.HEDERA_NETWORK?.toLowerCase()) {
      case "mainnet":
        client = Client.forMainnet();
        break;
      case "testnet":
        client = Client.forTestnet();
        break;
      default:
        throw new Error("HEDERA_NETWORK must be either 'mainnet' or 'testnet'");
    }

    // Set the operator account ID and private key
    client.setOperator(operatorId, operatorKey);

    return client;
  } catch (error) {
    console.error("Error creating Hedera client:", error);
    throw error;
  }
};

export default getClient;
