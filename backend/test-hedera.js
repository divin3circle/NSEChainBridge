const {
  AccountId,
  PrivateKey,
  Client,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();

async function main() {
  // Get Hedera credentials from environment variables
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  console.log("Using account:", operatorId);
  console.log("Using key:", operatorKey);

  if (!operatorId || !operatorKey) {
    throw new Error(
      "Environment variables HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set"
    );
  }

  // Create a client instance
  const client = Client.forTestnet();

  try {
    // Parse the private key
    let privateKey;
    if (operatorKey.startsWith("0x")) {
      // EVM format key
      privateKey = PrivateKey.fromStringECDSA(operatorKey);
    } else {
      // Add 0x prefix if missing
      privateKey = PrivateKey.fromStringECDSA(`0x${operatorKey}`);
    }

    console.log("Private key parsed successfully");

    // Set the client operator
    client.setOperator(AccountId.fromString(operatorId), privateKey);

    // Test a simple query to verify the connection
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(operatorId)
      .execute(client);

    console.log(
      `Balance of account ${operatorId}: ${accountBalance.hbars.toString()}`
    );
    console.log("Hedera connection successful!");
  } catch (error) {
    console.error("Error connecting to Hedera:");
    console.error(error);
  } finally {
    client.close();
  }
}

main();
