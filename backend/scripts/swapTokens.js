const {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  Client,
  AccountId,
  PrivateKey,
} = require("@hashgraph/sdk");

const params = new ContractFunctionParameters();
params.addUint256(100);
params.addUint256(0);
params.addAddressArray([
  "0x000000000000000000000000000000000058441c",
  "0x00000000000000000000000000000000005860c0",
]);
params.addAddress("0x4e6e8bc89523de1e65576136ce6863081ba30e52");
params.addUint256(0);

async function executeSwap(client, routerContractId, gasLim) {
  const record = await new ContractExecuteTransaction()
    .setContractId(routerContractId)
    .setGas(gasLim)
    .setFunction("swapExactTokensForTokens", params)
    .execute(client);

  console.log(record);

  const record2 = await record.getRecord(client);
  console.log(record2);
  const result = record2.contractFunctionResult;
  const values = result.getResult(["uint[]"]);
  const amounts = values[0];
  return amounts[amounts.length - 1];
}

const MY_ACCOUNT_ID = AccountId.fromString("0.0.5483001");
const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
  "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
);

const client = Client.forTestnet()
  .setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY)
  .setMaxAttempts(20)
  .setRequestTimeout(30000);

const routerContractId = "0.0.19264";
const gasLim = 3_500_000_000;

(async () => {
  try {
    const amount = await executeSwap(client, routerContractId, gasLim);
    console.log(amount);
  } catch (error) {
    console.error("Error executing swap:", error);
  } finally {
    client.close();
  }
})();

module.exports = { executeSwap };
