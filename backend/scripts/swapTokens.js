const {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  Client,
  AccountId,
  PrivateKey,
} = require("@hashgraph/sdk");
const dotenv = require("dotenv");

// Use the provided operator credentials
const HEDERA_OPERATOR_ID = AccountId.fromString("0.0.5483001");
const HEDERA_OPERATOR_KEY = PrivateKey.fromStringECDSA(
  "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
);
const HEDERA_OPERATOR_ADDRESS = "0x4e6e8bc89523de1e65576136ce6863081ba30e52";
const USDC_TOKEN_ID = "0.0.5791936";
const KCB_TOKEN_ID = "0.0.5784604";
const ROUTER_CONTRACT_ID = "0.0.19264";
const USDC_TOKEN_ADDRESS = "0x00000000000000000000000000000000005860c0";
const KCB_TOKEN_ADDRESS = "0x000000000000000000000000000000000058441c";

// Load environment variables for other config values
dotenv.config({ path: "../.env" });

/**
 * Swaps an exact amount of input tokens for as many output tokens as possible
 * @param {Client} client - Hedera client instance
 * @param {string} routerContractId - Router contract ID
 * @param {number} amountIn - Amount of input tokens to swap (in smallest unit)
 * @param {number} amountOutMin - Minimum amount of output tokens to receive (in smallest unit)
 * @param {string[]} tokenPath - Array of token addresses in the path [tokenIn, tokenOut] or [tokenIn, intermediateToken, tokenOut]
 * @param {string} toAddress - Destination address for the output tokens
 * @param {number} deadline - Unix timestamp after which the transaction will revert
 * @param {number} gasLim - Gas limit for the transaction
 * @returns {Object} Swap result with amounts and transaction ID
 */
async function swapExactTokensForTokens(
  client,
  routerContractId,
  amountIn,
  amountOutMin,
  tokenPath,
  toAddress,
  deadline,
  gasLim = 1_000_000
) {
  try {
    console.log(
      `Swapping ${amountIn} tokens along path [${tokenPath.join(" -> ")}]...`
    );

    // Client pre-checks:
    // - Output token is associated
    // - Router contract has spender allowance for the input token
    console.log("Preparing transaction parameters...");

    const params = new ContractFunctionParameters();
    params.addUint256(amountIn); // uint amountIn
    params.addUint256(amountOutMin); // uint amountOutMin
    params.addAddressArray(tokenPath); // address[] calldata path
    params.addAddress(toAddress); // address to
    params.addUint256(deadline); // uint deadline

    // client = Client.forTestnet();
    // client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);

    console.log("Executing swapExactTokensForTokens transaction...");
    const response = await new ContractExecuteTransaction()
      .setContractId(routerContractId)
      .setGas(gasLim)
      .setFunction("swapExactTokensForTokens", params)
      .execute(client);

    console.log("Transaction submitted. Fetching record...");
    const record = await response.getRecord(client);
    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    const values = result.getResult(["uint[]"]);
    const amounts = values[0]; // uint[] amounts
    const inputAmount = amounts[0];
    const outputAmount = amounts[amounts.length - 1];

    console.log("Swap executed successfully:");
    console.log(`- Input Amount: ${inputAmount.toString()}`);
    console.log(`- Output Amount: ${outputAmount.toString()}`);

    return {
      amounts: amounts.map((amount) => amount.toString()),
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
      transactionId: record.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error swapping tokens:", error);
    throw error;
  }
}

/**
 * Helper function to associate tokens if needed
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID to associate token with
 * @param {PrivateKey} privateKey - Private key of the account
 * @param {string} tokenId - Token ID to associate
 * @returns {Object} Receipt of the association transaction
 */
async function associateTokenToAccount(client, accountId, privateKey, tokenId) {
  try {
    console.log(`Associating token ${tokenId} with account ${accountId}...`);

    const transaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    const signedTx = await transaction.freezeWith(client).sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Token association status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error associating token:", error);
    throw error;
  }
}
// async function associateTokenToAccount(client, accountId, privateKey, tokenId) {
//   try {
//     console.log(`Associating token ${tokenId} with account ${accountId}...`);
    
//     const transaction = new TokenAssociateTransaction()
//       .setAccountId(accountId)
//       .setTokenIds([tokenId]);
      
//     const signedTx = await transaction.freezeWith(client).sign(privateKey);
//     const response = await signedTx.execute(client);
//     const receipt = await response.getReceipt(client);
    
//     console.log(`Token association status: ${receipt.status}`);
//     return receipt;
//   } catch (error) {
//     console.error('Error associating token:', error);
//     throw error;
//   }
// }

/**
 * Helper function to approve allowance for router contract
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID approving the allowance
 * @param {PrivateKey} privateKey - Private key of the account
 * @param {string} tokenId - Token ID to approve
 * @param {string} routerAddress - Router contract address
 * @param {number} amount - Amount to approve
 * @returns {Object} Receipt of the approval transaction
 */
async function approveAllowance(
  client,
  accountId,
  privateKey,
  tokenId,
  routerAddress,
  amount
) {
  try {
    console.log(
      `Approving ${amount} of token ${tokenId} for router ${routerAddress}...`
    );

    const transaction =
      new AccountAllowanceApproveTransaction().approveTokenAllowance(
        tokenId,
        accountId,
        routerAddress,
        amount
      );

    const signedTx = await transaction.freezeWith(client).sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Allowance approval status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error approving allowance:", error);
    throw error;
  }
}

/**
 * Example usage
 */
async function main() {
  console.log("Starting token swap process...");
  try {
    // Use the provided operator credentials
    const myAccountId = HEDERA_OPERATOR_ID;
    const myPrivateKey = HEDERA_OPERATOR_KEY;

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // Get other values from environment or use defaults
    const routerContractId = ROUTER_CONTRACT_ID;
    const fromTokenId = KCB_TOKEN_ID;
    const toTokenId = USDC_TOKEN_ID;
    const fromTokenAddress = KCB_TOKEN_ADDRESS;
    const toTokenAddress = USDC_TOKEN_ADDRESS;
    const myAccountAddress = HEDERA_OPERATOR_ADDRESS;

    // Example values - these would be set based on actual requirements
    const amountIn = 50; // 1 USDC (assuming 6 decimals)

    const amountOutMin = 0; // Minimum amount expected back
    const tokenPath = [fromTokenAddress, toTokenAddress]; // Direct swap path
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

    // Ensure destination token is associated
    try {
      await associateTokenToAccount(
        client,
        myAccountId,
        myPrivateKey,
        toTokenId
      );
      console.log("Token association completed.");
    } catch (error) {
      // If association fails because token is already associated, continue
      console.log(
        "Token likely already associated or error occurred:",
        error.message
      );
    }

    // Approve allowance for the token being sold
    await approveAllowance(
      client,
      myAccountId,
      myPrivateKey,
      fromTokenId,
      routerContractId,
      amountIn
    );

    // Execute swap
    const result = await swapExactTokensForTokens(
      client,
      routerContractId,
      amountIn,
      amountOutMin,
      tokenPath,
      myAccountAddress,
      deadline
    );

    console.log("Swap completed successfully:");
    console.log("- Swap amounts:", result.amounts);
    console.log("- Input amount:", result.inputAmount);
    console.log("- Output amount:", result.outputAmount);
    console.log("- Transaction ID:", result.transactionId);
  } catch (error) {
    console.error("Error in main execution:", error);
  }
}

// Run the script
// main();

// Export the functions for use in other scripts
module.exports = {
  swapExactTokensForTokens,
  associateTokenToAccount,
  approveAllowance,
};

