const {
  AccountId,
  PrivateKey,
  Client,
  TokenMintTransaction,
} = require("@hashgraph/sdk");

const USDC_TOKEN_ID = "0.0.5791936";
const STOCK_TOKEN_ID = "0.0.5784607";

async function main() {
  let client;
  try {
    // Your account ID and private key from string value
    const MY_ACCOUNT_ID = AccountId.fromString("0.0.5483001");
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
    );

    client = Client.forTestnet();

    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    const txTokenMint = await new TokenMintTransaction()
      .setTokenId(STOCK_TOKEN_ID)
      .setAmount(10000000000000)
      .freezeWith(client);

    const signTxTokenMint = await txTokenMint.sign(MY_PRIVATE_KEY);

    const txTokenMintResponse = await signTxTokenMint.execute(client);

    const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);

    const statusTokenMintTx = receiptTokenMintTx.status;

    const txTokenMintId = txTokenMintResponse.transactionId.toString();

    console.log(
      "--------------------------------- Mint Token ---------------------------------"
    );
    console.log("Receipt status           :", statusTokenMintTx.toString());
    console.log("Transaction ID           :", txTokenMintId);
    console.log(
      "Hashscan URL             :",
      "https://hashscan.io/testnet/tx/" + txTokenMintId
    );
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
