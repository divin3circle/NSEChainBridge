const {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  AccountUpdateTransaction,
  TokenAssociateTransaction,
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  Hbar,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Constants
const ROUTER_CONTRACT_ID = "0.0.19264";
const USDC_TOKEN_ID = "0.0.5791936";
const STOCK_TOKEN_ID = "0.0.5784607";

// Helper function to convert Hedera ID to EVM address
function hederaIdToEvmAddress(hederaId) {
  const token = TokenId.fromString(hederaId);
  return token.toSolidityAddress();
}

async function checkTokenBalances(client, tokenId, accountId) {
  try {
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    const tokenBalance = balance.tokens.get(tokenId);
    console.log(`Balance for token ${tokenId}: ${tokenBalance}`);
    return tokenBalance;
  } catch (error) {
    console.error(`Error checking balance for token ${tokenId}:`, error);
    throw error;
  }
}

async function createPool(
  client,
  routerContractId,
  tokenAId,
  tokenBId,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  accountId,
  deadline,
  poolCreationFeeHbar = 30
) {
  try {
    console.log(`Creating pool for tokens ${tokenAId} and ${tokenBId}...`);

    // Convert token IDs to EVM addresses
    const tokenAAddress = hederaIdToEvmAddress(tokenAId);
    const tokenBAddress = hederaIdToEvmAddress(tokenBId);
    const accountAddress = AccountId.fromString(accountId).toSolidityAddress();

    console.log("Token addresses:");
    console.log(`Token A (${tokenAId}): ${tokenAAddress}`);
    console.log(`Token B (${tokenBId}): ${tokenBAddress}`);
    console.log(`Account: ${accountAddress}`);

    // Convert amounts to proper decimals - 0 decimals for both tokens
    const adjustedAmountADesired = amountADesired; // No scaling needed for 0 decimals
    const adjustedAmountBDesired = amountBDesired; // No scaling needed for 0 decimals
    const adjustedAmountAMin = amountAMin; // No scaling needed for 0 decimals
    const adjustedAmountBMin = amountBMin; // No scaling needed for 0 decimals

    console.log("Adjusted amounts (0 decimals):");
    console.log(`Amount A Desired: ${adjustedAmountADesired}`);
    console.log(`Amount B Desired: ${adjustedAmountBDesired}`);
    console.log(`Amount A Min: ${adjustedAmountAMin}`);
    console.log(`Amount B Min: ${adjustedAmountBMin}`);
    console.log(`Deadline: ${deadline}`);

    // Validate parameters
    if (adjustedAmountADesired <= 0 || adjustedAmountBDesired <= 0) {
      throw new Error("Amounts must be greater than 0");
    }

    if (
      adjustedAmountAMin > adjustedAmountADesired ||
      adjustedAmountBMin > adjustedAmountBDesired
    ) {
      throw new Error("Minimum amounts cannot be greater than desired amounts");
    }

    // Create function parameters
    const params = new ContractFunctionParameters()
      .addAddress(tokenAAddress)
      .addAddress(tokenBAddress)
      .addUint256(adjustedAmountADesired)
      .addUint256(adjustedAmountBDesired)
      .addUint256(adjustedAmountAMin)
      .addUint256(adjustedAmountBMin)
      .addAddress(accountAddress)
      .addUint256(deadline);

    console.log("Executing addLiquidityNewPool transaction...");
    console.log(`Router Contract ID: ${routerContractId}`);
    console.log(`Pool Creation Fee: ${poolCreationFeeHbar} HBAR`);
    console.log("Token order:");
    console.log(`- Token A (${tokenAId}): ${tokenAAddress}`);
    console.log(`- Token B (${tokenBId}): ${tokenBAddress}`);
    console.log(`- Account: ${accountAddress}`);

    // Create and freeze the transaction
    const transaction = new ContractExecuteTransaction()
      .setPayableAmount(new Hbar(poolCreationFeeHbar))
      .setContractId(routerContractId)
      .setGas(8_000_000) // Increased gas limit
      .setFunction("addLiquidityNewPool", params);

    // Freeze the transaction before signing
    transaction.freezeWith(client);

    // Execute the transaction
    console.log("Submitting transaction...");
    const response = await transaction.execute(client);
    console.log(
      "Transaction submitted. Transaction ID:",
      response.transactionId.toString()
    );

    // Get the transaction record with error handling
    let record;
    try {
      console.log("Waiting for transaction record...");
      record = await response.getRecord(client);
      console.log("Got transaction record.");
    } catch (error) {
      console.error("Error getting transaction record:", error);
      if (error.status) {
        console.error("Error status code:", error.status._code);
      }
      if (error.transactionReceipt) {
        console.error(
          "Transaction receipt:",
          JSON.stringify(error.transactionReceipt, null, 2)
        );
      }
      if (error.message) {
        console.error("Error message:", error.message);
      }
      throw error;
    }

    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    // Log the raw result for debugging
    console.log("Raw contract result:", JSON.stringify(result, null, 2));

    // Check for error message in the result
    if (result.errorMessage) {
      console.error("Contract error message:", result.errorMessage);
      throw new Error(`Contract execution failed: ${result.errorMessage}`);
    }

    const values = result.getResult(["uint256", "uint256", "uint256"]);
    const amountA = Number(values[0]) / Math.pow(10, 6);
    const amountB = Number(values[1]) / Math.pow(10, 6);
    const liquidity = Number(values[2]) / Math.pow(10, 6);

    console.log("Pool created successfully:");
    console.log(`- Amount A: ${amountA}`);
    console.log(`- Amount B: ${amountB}`);
    console.log(`- Liquidity tokens: ${liquidity}`);

    return {
      amountA,
      amountB,
      liquidity,
      transactionId: record.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error creating pool:", error);
    if (error.transactionReceipt) {
      console.error(
        "Transaction receipt:",
        JSON.stringify(error.transactionReceipt, null, 2)
      );
    }
    if (error.transactionId) {
      console.error("Transaction ID:", error.transactionId.toString());
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

// Helper function to approve allowance for router contract
async function approveAllowance(
  client,
  tokenId,
  spenderAddress,
  amount,
  privateKey
) {
  try {
    const adjustedAmount = amount * Math.pow(10, 6); // Convert to 6 decimals
    console.log(
      `Approving ${adjustedAmount} of token ${tokenId} for router ${spenderAddress}...`
    );

    // Create and freeze the transaction
    const transaction =
      new AccountAllowanceApproveTransaction().approveTokenAllowance(
        TokenId.fromString(tokenId),
        AccountId.fromString(client.operatorAccountId.toString()),
        AccountId.fromString(spenderAddress),
        adjustedAmount
      );

    // Freeze the transaction before signing
    transaction.freezeWith(client);

    // Sign with the provided private key
    const signedTx = await transaction.sign(privateKey);

    // Execute the signed transaction
    const response = await signedTx.execute(client);

    // Wait for the transaction to be processed
    const receipt = await response.getReceipt(client);

    console.log(`Allowance approval status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error approving allowance:", error);
    throw error;
  }
}

async function main() {
  try {
    // Initialize client with operator account
    const operatorId = AccountId.fromString("0.0.5483001");
    const operatorKey = PrivateKey.fromStringECDSA(
      "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
    );

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    // Add a small delay to ensure client is properly initialized
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Pool creation parameters
    const amountADesired = 100; // 100 stock tokens
    const amountBDesired = 100; // 100 USDC
    const amountAMin = 95; // 95% of desired amount
    const amountBMin = 95; // 95% of desired amount
    const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

    // Verify token balances before proceeding
    console.log("Verifying token balances...");
    const stockBalance = await checkTokenBalances(
      client,
      STOCK_TOKEN_ID,
      operatorId
    );
    const usdcBalance = await checkTokenBalances(
      client,
      USDC_TOKEN_ID,
      operatorId
    );

    if (stockBalance < amountADesired) {
      throw new Error(
        `Insufficient stock token balance. Required: ${amountADesired}, Available: ${stockBalance}`
      );
    }
    if (usdcBalance < amountBDesired) {
      throw new Error(
        `Insufficient USDC balance. Required: ${amountBDesired}, Available: ${usdcBalance}`
      );
    }
    console.log("Token balances verified successfully.");

    // Approve token spending with delays between approvals
    await approveAllowance(
      client,
      STOCK_TOKEN_ID, // Stock token first (token0)
      ROUTER_CONTRACT_ID,
      amountADesired,
      operatorKey
    );

    // Add a longer delay between approvals
    await new Promise((resolve) => setTimeout(resolve, 4000));

    await approveAllowance(
      client,
      USDC_TOKEN_ID, // USDC second (token1)
      ROUTER_CONTRACT_ID,
      amountBDesired,
      operatorKey
    );

    // Add a longer delay before creating the pool
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Create the pool with swapped token order and correct pool creation fee
    const result = await createPool(
      client,
      ROUTER_CONTRACT_ID,
      STOCK_TOKEN_ID,
      USDC_TOKEN_ID,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      operatorId.toString(),
      deadline,
      100 // Increased pool creation fee to 100 HBAR
    );

    console.log("Pool creation result:", result);
  } catch (error) {
    console.error("Error in main execution:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createPool,
  approveAllowance,
};
