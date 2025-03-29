import {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  ContractId,
  Hbar,
} from "@hashgraph/sdk";
import getClient from "../config/hedera";
import { OPERATOR_KEY } from "../config/hedera";
import User from "../models/User";
class SaucerSwapService {
  private client: Client;
  private routerContractId: ContractId;
  private routerAccountId: AccountId;

  constructor() {
    this.client = getClient();
    // SaucerSwap Router Contract ID on Hedera Testnet
    this.routerContractId = ContractId.fromString("0.0.19264");
    this.routerAccountId = AccountId.fromString("0.0.19264");
  }

  /**
   * Swap exact tokens for tokens using SaucerSwap
   * @param amountIn Exact amount of input tokens
   * @param amountOutMin Minimum amount of output tokens to receive
   * @param tokenPath Array of token addresses in the swap path
   * @param toAddress Address to receive the output tokens
   * @param deadline Unix timestamp deadline for the swap
   * @returns Transaction record
   */
  async swapExactTokensForTokens(
    amountIn: number,
    amountOutMin: number,
    tokenPath: string[],
    toAddress: string,
    deadline: number
  ): Promise<any> {
    try {
      // Convert Hedera token IDs to EVM addresses
      const evmTokenPath = tokenPath.map((tokenId) => {
        // Convert Hedera token ID to EVM address format
        const token = TokenId.fromString(tokenId);
        const evmAddress = token.toSolidityAddress();
        console.log(
          `Converting token ${tokenId} to EVM address: ${evmAddress}`
        );
        return evmAddress;
      });

      // Convert Hedera account ID to EVM address
      const evmToAddress = AccountId.fromString(toAddress).toSolidityAddress();
      console.log(
        `Converting account ${toAddress} to EVM address: ${evmToAddress}`
      );

      // Create function parameters
      const params = new ContractFunctionParameters()
        .addUint256(amountIn)
        .addUint256(amountOutMin)
        .addAddressArray(evmTokenPath)
        .addAddress(evmToAddress)
        .addUint256(deadline);

      // Create and execute the swap transaction
      const record = await new ContractExecuteTransaction()
        .setContractId(this.routerContractId)
        .setGas(500000) // Adjust gas limit as needed
        .setFunction("swapExactTokensForTokens", params)
        .execute(this.client);

      // Get the transaction record
      const txRecord = await record.getRecord(this.client);
      const result = txRecord.contractFunctionResult!;
      const values = result.getResult(["uint[]"]);
      const amounts = values[0]; // uint[] amounts
      const finalOutputAmount = amounts[amounts.length - 1];

      return {
        status: "SUCCESS",
        transactionId: record.transactionId?.toString(),
        finalOutputAmount,
      };
    } catch (error: any) {
      console.error("Error executing SaucerSwap:", error);
      throw new Error(`Failed to execute SaucerSwap: ${error.message}`);
    }
  }

  /**
   * Approve token spending for SaucerSwap router
   * @param tokenId Token to approve
   * @param amount Amount to approve
   * @param accountId Account approving the spending
   * @param userId User ID to get private key from
   * @returns Transaction record
   */
  async approveTokenSpending(
    tokenId: string,
    amount: number,
    accountId: string,
    userId: string
  ): Promise<any> {
    try {
      // Get user's private key
      const user = await User.findById(userId).select("+privateKey");
      if (!user || !user.privateKey) {
        console.log("User or private key not found:", user);
        throw new Error("User private key not found");
      }

      console.log(
        "Private key format:",
        user.privateKey.substring(0, 10) + "..."
      );

      let userPrivateKey;
      try {
        // Try DER format first
        userPrivateKey = PrivateKey.fromStringDer(user.privateKey);
        console.log("Successfully parsed key in DER format");
      } catch (error) {
        try {
          // Then try ECDSA format
          userPrivateKey = PrivateKey.fromStringECDSA(user.privateKey);
          console.log("Successfully parsed key in ECDSA format");
        } catch (error) {
          try {
            // Finally try standard format (ED25519)
            userPrivateKey = PrivateKey.fromString(user.privateKey);
            console.log("Successfully parsed key in standard format");
          } catch (error) {
            console.error("Failed to parse private key in all formats:", error);
            throw new Error("Invalid private key format");
          }
        }
      }

      console.log("Key type:", userPrivateKey.constructor.name);

      const transaction = new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(
          TokenId.fromString(tokenId),
          AccountId.fromString(accountId),
          this.routerAccountId,
          amount
        )
        .freezeWith(this.client);

      const signedTx = await transaction.sign(userPrivateKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      return {
        status: "SUCCESS",
        transactionId: txResponse.transactionId?.toString(),
      };
    } catch (error: any) {
      console.error("Error approving token spending:", error);
      throw new Error(`Failed to approve token spending: ${error.message}`);
    }
  }

  /**
   * Associate token with an account for SaucerSwap
   * @param tokenId Token to associate
   * @param accountId Account to associate with
   * @param userId User ID to get private key from
   * @returns Transaction record
   */
  async associateTokenForSwap(
    tokenId: string,
    accountId: string,
    userId: string
  ): Promise<any> {
    try {
      // Get user's private key
      const user = await User.findById(userId).select("+privateKey");
      if (!user || !user.privateKey) {
        console.log("User or private key not found:", user);
        throw new Error("User private key not found");
      }

      console.log(
        "Private key format:",
        user.privateKey.substring(0, 10) + "..."
      );

      let userPrivateKey;
      try {
        // Try DER format first
        userPrivateKey = PrivateKey.fromStringDer(user.privateKey);
        console.log("Successfully parsed key in DER format");
      } catch (error) {
        try {
          // Then try ECDSA format
          userPrivateKey = PrivateKey.fromStringECDSA(user.privateKey);
          console.log("Successfully parsed key in ECDSA format");
        } catch (error) {
          try {
            // Finally try standard format (ED25519)
            userPrivateKey = PrivateKey.fromString(user.privateKey);
            console.log("Successfully parsed key in standard format");
          } catch (error) {
            console.error("Failed to parse private key in all formats:", error);
            throw new Error("Invalid private key format");
          }
        }
      }

      console.log("Key type:", userPrivateKey.constructor.name);

      const transaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(this.client);

      const signedTx = await transaction.sign(userPrivateKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      return {
        status: "SUCCESS",
        transactionId: txResponse.transactionId?.toString(),
      };
    } catch (error: any) {
      console.error("Error associating token:", error);
      throw new Error(`Failed to associate token: ${error.message}`);
    }
  }
}

export default new SaucerSwapService();
