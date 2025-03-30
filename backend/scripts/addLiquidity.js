const {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  ContractCallQuery,
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  ContractId,
  Hbar,
} = require("@hashgraph/sdk");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Constants
const ROUTER_CONTRACT_ID = "0.0.19264"; // SaucerSwapV1RouterV3
const USDC_TOKEN_ID = "0.0.5791936";
const STOCK_TOKEN_ID = "0.0.5784604";
const FACTORY_CONTRACT_ID = "0.0.9959"; // Updated to correct testnet factory address

// Helper function to convert Hedera ID to EVM address
function hederaIdToEvmAddress(hederaId) {
  const token = TokenId.fromString(hederaId);
  return token.toSolidityAddress();
}

// Helper function to convert EVM address to Hedera ID
function evmAddressToHederaId(evmAddress) {
  // Remove '0x' prefix if present
  const cleanAddress = evmAddress.replace("0x", "");
  // Convert to Hedera contract ID format (0.0.{number})
  const num = parseInt(cleanAddress.slice(-8), 16);
  return `0.0.${num}`;
}

// Helper function to check token associations and balances
async function checkTokensAndBalances(client, accountId, tokenIds) {
  try {
    console.log(
      `Checking token associations and balances for account ${accountId}...`
    );

    const balanceQuery = new AccountBalanceQuery().setAccountId(
      AccountId.fromString(accountId)
    );

    const accountBalance = await balanceQuery.execute(client);
    console.log(`HBAR Balance: ${accountBalance.hbars.toString()}`);

    for (const tokenId of tokenIds) {
      const balance = accountBalance.tokens.get(TokenId.fromString(tokenId));
      console.log(
        `Token ${tokenId} Balance: ${balance ? balance.toString() : "0"}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error checking token associations:", error);
    throw error;
  }
}

// Helper function to associate tokens if needed
async function associateTokens(client, accountId, tokenIds, privateKey) {
  try {
    console.log(`Associating tokens for account ${accountId}...`);

    const transaction = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds(tokenIds.map((id) => TokenId.fromString(id)));

    transaction.freezeWith(client);
    const signedTx = await transaction.sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Token association status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    if (
      error.message &&
      error.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")
    ) {
      console.log("Tokens are already associated with the account");
      return true;
    }
    console.error("Error associating tokens:", error);
    throw error;
  }
}

async function addLiquidity(
  client,
  routerContractId,
  tokenAId,
  tokenBId,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  accountId,
  deadline
) {
  try {
    console.log(`Adding liquidity for tokens ${tokenAId} and ${tokenBId}...`);

    // Convert token IDs to EVM addresses
    const tokenAAddress = hederaIdToEvmAddress(tokenAId);
    const tokenBAddress = hederaIdToEvmAddress(tokenBId);
    const accountAddress = AccountId.fromString(accountId).toSolidityAddress();

    console.log("Token addresses:");
    console.log(`Token A (${tokenAId}): ${tokenAAddress}`);
    console.log(`Token B (${tokenBId}): ${tokenBAddress}`);
    console.log(`Account: ${accountAddress}`);

    // Convert amounts to proper decimals (assuming both tokens use 6 decimals)
    const adjustedAmountADesired = amountADesired * Math.pow(10, 6);
    const adjustedAmountBDesired = amountBDesired * Math.pow(10, 6);
    const adjustedAmountAMin = amountAMin * Math.pow(10, 6);
    const adjustedAmountBMin = amountBMin * Math.pow(10, 6);

    console.log("Adjusted amounts:");
    console.log(`Amount A Desired: ${adjustedAmountADesired}`);
    console.log(`Amount B Desired: ${adjustedAmountBDesired}`);
    console.log(`Amount A Min: ${adjustedAmountAMin}`);
    console.log(`Amount B Min: ${adjustedAmountBMin}`);

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

    // Create function parameters for addLiquidity
    const params = new ContractFunctionParameters()
      .addAddress(tokenAAddress)
      .addAddress(tokenBAddress)
      .addUint256(adjustedAmountADesired)
      .addUint256(adjustedAmountBDesired)
      .addUint256(adjustedAmountAMin)
      .addUint256(adjustedAmountBMin)
      .addAddress(accountAddress)
      .addUint256(deadline);

    console.log("Executing addLiquidity transaction...");
    console.log(`Router Contract ID: ${routerContractId}`);

    // Create and freeze the transaction
    const transaction = new ContractExecuteTransaction()
      .setContractId(routerContractId)
      .setGas(8_000_000)
      .setPayableAmount(new Hbar(10)) // Add 10 HBAR for fees
      .setFunction("addLiquidity", params);

    // Freeze the transaction before signing
    transaction.freezeWith(client);

    // Execute the transaction
    const response = await transaction.execute(client);

    console.log("Transaction submitted. Fetching record...");

    // Get the transaction record with error handling
    let record;
    try {
      record = await response.getRecord(client);
    } catch (error) {
      console.error("Error getting transaction record:", error);
      if (error.transactionReceipt) {
        console.error("Transaction receipt:", error.transactionReceipt);
      }
      throw error;
    }

    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    // Log the raw result for debugging
    console.log("Raw contract result:", result);

    const values = result.getResult(["uint256", "uint256", "uint256"]);
    const amountA = Number(values[0]) / Math.pow(10, 6);
    const amountB = Number(values[1]) / Math.pow(10, 6);
    const liquidity = Number(values[2]) / Math.pow(10, 6);

    console.log("Liquidity added successfully:");
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
    console.error("Error adding liquidity:", error);
    if (error.transactionReceipt) {
      console.error("Transaction receipt:", error.transactionReceipt);
    }
    if (error.transactionId) {
      console.error("Transaction ID:", error.transactionId);
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

// Helper function to check if pool exists and get its details
async function checkPool(client, tokenA, tokenB) {
  try {
    console.log(`Checking pool for tokens ${tokenA} and ${tokenB}...`);

    const tokenAAddress = hederaIdToEvmAddress(tokenA);
    const tokenBAddress = hederaIdToEvmAddress(tokenB);

    // Call getPair function on the factory contract
    const query = new ContractCallQuery()
      .setContractId(FACTORY_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "getPair",
        new ContractFunctionParameters()
          .addAddress(tokenAAddress)
          .addAddress(tokenBAddress)
      );

    const response = await query.execute(client);
    const pairAddress = response.getAddress(0);

    console.log("Pool address (EVM):", pairAddress);

    if (pairAddress === "0000000000000000000000000000000000000000") {
      console.log(
        "Pool does not exist! You need to create the pool first using createPool.js"
      );
      return null;
    }

    // Get pool reserves using the EVM address
    const reservesQuery = new ContractCallQuery()
      .setContractId(FACTORY_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "getReserves",
        new ContractFunctionParameters().addAddress(pairAddress)
      );

    const reservesResponse = await reservesQuery.execute(client);
    const reserve0 = reservesResponse.getUint256(0);
    const reserve1 = reservesResponse.getUint256(1);

    console.log("Pool reserves:");
    console.log(`- Token0 (${tokenA}): ${reserve0}`);
    console.log(`- Token1 (${tokenB}): ${reserve1}`);

    return {
      pairAddress,
      reserve0,
      reserve1,
    };
  } catch (error) {
    console.error("Error checking pool:", error);
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

    // Check token associations and balances first
    await checkTokensAndBalances(client, operatorId.toString(), [
      USDC_TOKEN_ID,
      STOCK_TOKEN_ID,
    ]);

    // Check pool details
    const poolDetails = await checkPool(client, STOCK_TOKEN_ID, USDC_TOKEN_ID);
    if (!poolDetails) {
      console.error("Pool does not exist. Cannot add liquidity.");
      process.exit(1);
    }

    // Try to associate tokens if needed
    await associateTokens(
      client,
      operatorId.toString(),
      [USDC_TOKEN_ID, STOCK_TOKEN_ID],
      operatorKey
    );

    // Reduced amounts for testing
    const amountADesired = 100; // 100 stock tokens
    const amountBDesired = 100; // 100 USDC
    const amountAMin = 95; // 95% of desired amount
    const amountBMin = 95; // 95% of desired amount
    const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

    // Calculate optimal amounts based on pool reserves
    const reserve0 = Number(poolDetails.reserve0);
    const reserve1 = Number(poolDetails.reserve1);
    if (reserve0 > 0 && reserve1 > 0) {
      const quote = (amountADesired * reserve1) / reserve0;
      console.log(
        `Optimal amount of USDC for ${amountADesired} stock tokens: ${quote}`
      );
      // Adjust amountBDesired to match the pool ratio
      amountBDesired = Math.ceil(quote);
    }

    // Approve token spending with delays between approvals
    console.log("Starting token approvals...");
    await approveAllowance(
      client,
      STOCK_TOKEN_ID,
      ROUTER_CONTRACT_ID,
      amountADesired,
      operatorKey
    );

    // Add a longer delay between approvals
    console.log("Waiting for first approval to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    await approveAllowance(
      client,
      USDC_TOKEN_ID,
      ROUTER_CONTRACT_ID,
      amountBDesired,
      operatorKey
    );

    // Add a longer delay before adding liquidity
    console.log("Waiting for second approval to be processed...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    console.log("Starting liquidity addition...");
    // Add liquidity to the existing pool
    const result = await addLiquidity(
      client,
      ROUTER_CONTRACT_ID,
      STOCK_TOKEN_ID,
      USDC_TOKEN_ID,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      operatorId.toString(),
      deadline
    );

    console.log("Liquidity addition completed:", result);
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
  addLiquidity,
  approveAllowance,
};
