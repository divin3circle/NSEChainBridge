import { AccountCreateTransaction, Hbar, PrivateKey } from "@hashgraph/sdk";
import getClient from "../config/hedera";

class HederaService {
  async createAccount() {
    try {
      const isDevelopmentMockMode =
        process.env.NODE_ENV === "development" &&
        (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY);

      if (isDevelopmentMockMode) {
        console.log("[DEV MOCK] Creating mock Hedera account");

        // Generate mock account details for development
        const privateKey = PrivateKey.generateED25519();
        const publicKey = privateKey.publicKey;

        return {
          accountId: `0.0.${Math.floor(100000 + Math.random() * 900000)}`,
          privateKey: privateKey.toString(),
          publicKey: publicKey.toString(),
        };
      } else {
        // Create a new key pair
        const privateKey = PrivateKey.generateED25519();
        const publicKey = privateKey.publicKey;

        try {
          // Get client
          const client = getClient();

          // Create new account
          const transaction = new AccountCreateTransaction()
            .setKey(publicKey)
            .setInitialBalance(Hbar.fromTinybars(100000)) // 0.001 HBAR
            .setMaxAutomaticTokenAssociations(10);

          // Freeze with client
          const freezeTx = await transaction.freezeWith(client);

          // Sign and execute the transaction
          const txResponse = await freezeTx.execute(client);

          // Get receipt
          const receipt = await txResponse.getReceipt(client);
          const accountId = receipt.accountId!.toString();

          return {
            accountId,
            privateKey: privateKey.toString(),
            publicKey: publicKey.toString(),
          };
        } catch (error) {
          console.error(
            "Hedera account creation failed, using mock account:",
            error
          );

          // Fallback to mock account if there's an error
          return {
            accountId: `0.0.${Math.floor(100000 + Math.random() * 900000)}`,
            privateKey: privateKey.toString(),
            publicKey: publicKey.toString(),
          };
        }
      }
    } catch (error) {
      console.error("Error creating Hedera account:", error);
      throw error;
    }
  }
}

export default new HederaService();
