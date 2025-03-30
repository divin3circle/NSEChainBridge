const {
  AccountId,
  PrivateKey,
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");
require("dotenv").config();

// Constants
const STOCK_TOKEN_ID = "0.0.5784607"; // Your stock token
const USDC_TOKEN_ID = "0.0.5791936"; // USDC token
const POOL_CONTRACT_ID = process.env.POOL_CONTRACT_ID; // Add this to your .env file

async function swapTokens(amount, isStockToUsdc) {
  let client;
  try {
    // Get operator from environment variables
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_PVKEY);

    // Create client
    client = Client.forTestnet()
      .setOperator(operatorId, operatorKey)
      .setMaxAttempts(20)
      .setRequestTimeout(30000);

    console.log(
      `\nExecuting ${isStockToUsdc ? "Stock to USDC" : "USDC to Stock"} swap...`
    );
    console.log(`Amount: ${amount}`);

    // Get current reserves
    const getReservesTx = new ContractExecuteTransaction()
      .setContractId(POOL_CONTRACT_ID)
      .setGas(100000)
      .setFunction("getReserves");

    const reservesResponse = await getReservesTx.execute(client);
    const reserves = reservesResponse.getResult(["uint256", "uint256"]);

    console.log("\nCurrent Pool Reserves:");
    console.log(`Stock Reserve: ${reserves[0]}`);
    console.log(`USDC Reserve: ${reserves[1]}`);

    // Approve token spending
    const tokenId = isStockToUsdc ? STOCK_TOKEN_ID : USDC_TOKEN_ID;
    console.log(`\nApproving token spending for ${tokenId}...`);

    const approveTx = new ContractExecuteTransaction()
      .setContractId(tokenId)
      .setGas(100000)
      .setFunction(
        "approve",
        new ContractFunctionParameters()
          .addAddress(POOL_CONTRACT_ID)
          .addUint256(amount)
      );

    await approveTx.execute(client);

    // Execute swap
    console.log("\nExecuting swap...");
    const swapFunction = isStockToUsdc
      ? "swapStockForUsdc"
      : "swapUsdcForStock";

    const swapTx = new ContractExecuteTransaction()
      .setContractId(POOL_CONTRACT_ID)
      .setGas(200000)
      .setFunction(
        swapFunction,
        new ContractFunctionParameters().addUint256(amount)
      );

    const swapResponse = await swapTx.execute(client);
    const swapReceipt = await swapResponse.getReceipt(client);

    // Get updated reserves
    const updatedReservesResponse = await getReservesTx.execute(client);
    const updatedReserves = updatedReservesResponse.getResult([
      "uint256",
      "uint256",
    ]);

    console.log("\nUpdated Pool Reserves:");
    console.log(`Stock Reserve: ${updatedReserves[0]}`);
    console.log(`USDC Reserve: ${updatedReserves[1]}`);

    console.log("\nSwap completed successfully!");
    console.log(`Transaction ID: ${swapResponse.transactionId}`);

    return {
      transactionId: swapResponse.transactionId,
      newStockReserve: updatedReserves[0],
      newUsdcReserve: updatedReserves[1],
    };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  } finally {
    if (client) client.close();
  }
}

// Example usage
if (require.main === module) {
  const amount = 100; // Amount to swap
  const isStockToUsdc = true; // true for Stock to USDC, false for USDC to Stock

  swapTokens(amount, isStockToUsdc)
    .then((result) => {
      console.log("\nSwap Result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Swap failed:", error);
      process.exit(1);
    });
}

module.exports = {
  swapTokens,
};
