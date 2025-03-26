import {
  AccountCreateTransaction,
  AccountBalanceQuery,
  Hbar,
  PrivateKey,
  AccountId,
  AccountInfoQuery,
  TransferTransaction,
} from "@hashgraph/sdk";
import getClient from "../config/hedera";

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
      const client = getClient();

      // Generate a new ECDSA key pair (compatible with EVM)
      const newKey = PrivateKey.generateECDSA();
      const newPublicKey = newKey.publicKey;

      console.log("Creating new Hedera account...");

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
   * Transfer HBAR from one account to another
   * @param senderAccountId Sender account ID
   * @param receiverAccountId Receiver account ID
   * @param amount Amount to transfer in HBAR
   * @param senderPrivateKey Private key of the sender
   * @returns Transaction receipt
   */
  async transferHbar(
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    senderPrivateKey: string
  ): Promise<any> {
    try {
      const client = getClient();

      // Parse the private key based on its format
      let privateKey;
      if (senderPrivateKey.startsWith("302")) {
        // DER format
        privateKey = PrivateKey.fromString(senderPrivateKey);
      } else if (senderPrivateKey.startsWith("0x")) {
        // EVM format
        privateKey = PrivateKey.fromStringECDSA(senderPrivateKey);
      } else {
        privateKey = PrivateKey.fromStringECDSA(`0x${senderPrivateKey}`);
      }

      // Create transfer transaction
      const transaction = await new TransferTransaction()
        .addHbarTransfer(
          AccountId.fromString(senderAccountId),
          new Hbar(-amount)
        )
        .addHbarTransfer(
          AccountId.fromString(receiverAccountId),
          new Hbar(amount)
        )
        .freezeWith(client)
        .sign(privateKey);

      // Submit the transaction to the Hedera network
      const txResponse = await transaction.execute(client);

      // Get the receipt
      const receipt = await txResponse.getReceipt(client);

      return receipt;
    } catch (error) {
      console.error("Error transferring HBAR:", error);
      throw error;
    }
  }
}

export default new AccountService();
