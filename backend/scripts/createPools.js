const { 
    ContractFunctionParameters, 
    ContractExecuteTransaction,
    AccountAllowanceApproveTransaction,
    AccountUpdateTransaction, //for token auto-association
    TokenAssociateTransaction,
    Client,
    AccountId,
    PrivateKey
} = require('@hashgraph/sdk');
const dotenv = require("dotenv");

// Use the provided operator credentials
const HEDERA_OPERATOR_ID = AccountId.fromString("0.0.5483001");
const HEDERA_OPERATOR_KEY = PrivateKey.fromStringECDSA(
  "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
);
const HEDERA_OPERATOR_ADDRESS = "0x4e6e8bc89523de1e65576136ce6863081ba30e52";
const USDC_TOKEN_ID = "0.0.5791936";
const EQUITY_TOKEN_ID = "0.0.5784606";
const ROUTER_CONTRACT_ID = "0.0.19264";
const USDC_TOKEN_ADDRESS = "0x00000000000000000000000000000000005860c0";
const EQUITY_TOKEN_ADDRESS = "0x000000000000000000000000000000000058441e";

// Load environment variables
dotenv.config({ path: '../.env' });

async function createPool(
    client,
    routerContractId,
    tokenAEvmAddress, 
    tokenBEvmAddress, 
    amountADesired, 
    amountBDesired, 
    amountAMin, 
    amountBMin, 
    toEvmAddress, 
    deadline,
    poolCreationFeeHbar,
    gasLim = 6_200_000
) {
    try {
        console.log(`Creating pool for tokens ${tokenAEvmAddress} and ${tokenBEvmAddress}...`);
        
        const params = new ContractFunctionParameters();
        params.addAddress(tokenAEvmAddress); //address tokenA
        params.addAddress(tokenBEvmAddress); //address tokenB
        params.addUint256(amountADesired); //uint amountADesired
        params.addUint256(amountBDesired); //uint amountBDesired
        params.addUint256(amountAMin); //uint amountAMin
        params.addUint256(amountBMin); //uint amountBMin
        params.addAddress(toEvmAddress); //address to
        params.addUint256(deadline); //uint deadline
            
        console.log('Executing addLiquidityNewPool transaction...');
        const response = await new ContractExecuteTransaction()
         .setPayableAmount(poolCreationFeeHbar)
         .setContractId(routerContractId)
         .setGas(gasLim)
         .setFunction('addLiquidityNewPool', params)
         .execute(client);
         
        console.log('Transaction submitted. Fetching record...');
        const record = await response.getRecord(client);
        const result = record.contractFunctionResult;
        
        if (!result) {
            throw new Error('Contract execution failed: No result returned');
        }
        
        const values = result.getResult(['uint','uint','uint']);
        const amountA = values[0]; //uint amountA - in its smallest unit
        const amountB = values[1]; //uint amountB - in its smallest unit
        const liquidity = values[2]; //uint liquidity
        
        console.log('Pool created successfully:');
        console.log(`- Amount A: ${amountA.toString()}`);
        console.log(`- Amount B: ${amountB.toString()}`);
        console.log(`- Liquidity tokens: ${liquidity.toString()}`);
        
        return {
            amountA,
            amountB,
            liquidity,
            transactionId: record.transactionId.toString()
        };
    } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
    }
}

// Helper function to increase max auto-associations
async function increaseAutoAssociations(client, accountId, privateKey, count = 1) {
    try {
        console.log(`Increasing max auto-associations for account ${accountId} by ${count}...`);
        
        const transaction = new AccountUpdateTransaction()
            .setAccountId(accountId)
            .setMaxAutomaticTokenAssociations(count);
            
        const signedTx = await transaction.freezeWith(client).sign(privateKey);
        const response = await signedTx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log(`Auto-association increase status: ${receipt.status}`);
        return receipt;
    } catch (error) {
        console.error('Error increasing auto-associations:', error);
        throw error;
    }
}
// // Helper function to associate tokens if needed
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

// Helper function to approve allowance for router contract
async function approveAllowance(client, accountId, privateKey, tokenId, routerAddress, amount) {
    try {
        console.log(`Approving ${amount} of token ${tokenId} for router ${routerAddress}...`);
        
        const transaction = new AccountAllowanceApproveTransaction()
            .approveTokenAllowance(tokenId, accountId, routerAddress, amount);
            
        const signedTx = await transaction.freezeWith(client).sign(privateKey);
        const response = await signedTx.execute(client);
        const receipt = await response.getReceipt(client);
        
        console.log(`Allowance approval status: ${receipt.status}`);
        return receipt;
    } catch (error) {
        console.error('Error approving allowance:', error);
        throw error;
    }
}

// Example usage
async function main() {
    console.log('Starting pool creation process...');
    try {
        // Use the provided operator credentials instead of environment variables
        const myAccountId = HEDERA_OPERATOR_ID;
        const myPrivateKey = HEDERA_OPERATOR_KEY;
        
        const client = Client.forTestnet();
        client.setOperator(myAccountId, myPrivateKey);
        
        // Get other values from constants or use defaults
        const routerContractId = ROUTER_CONTRACT_ID;
        const tokenAId = USDC_TOKEN_ID;
        const tokenBId = EQUITY_TOKEN_ID;
        const tokenAAddress = USDC_TOKEN_ADDRESS;
        const tokenBAddress = EQUITY_TOKEN_ADDRESS;
        const myAccountAddress = HEDERA_OPERATOR_ADDRESS;
        
        // Example values - these would be set based on actual requirements
        const amountADesired = 100000;
        const amountBDesired = 200000;
        const amountAMin = 95000;
        const amountBMin = 190000;
        const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
        const poolCreationFeeHbar = 30; // HBAR fee for creating a pool
        
        // Increase max auto-associations to accommodate new LP token
        await increaseAutoAssociations(client, myAccountId, myPrivateKey, 1);

        // await associateTokenToAccount(client, myAccountId, myPrivateKey, tokenBId);
        
        // Approve allowances
        await approveAllowance(client, myAccountId, myPrivateKey, tokenAId, routerContractId, amountADesired);
        await approveAllowance(client, myAccountId, myPrivateKey, tokenBId, routerContractId, amountBDesired);
        
        // Create pool
        const result = await createPool(
            client,
            routerContractId,
            tokenAAddress,
            tokenBAddress,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            myAccountAddress,
            deadline,
            poolCreationFeeHbar
        );
        
        console.log('Pool creation completed:', result);
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

// Uncomment to run the script directly
main();

// Export the functions for use in other scripts
module.exports = {
    createPool,
    increaseAutoAssociations,
    approveAllowance
};

