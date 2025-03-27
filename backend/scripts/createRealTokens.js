const {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} = require("@hashgraph/sdk"); // v2.46.0
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Define Token Schema
const TokenMetadataSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    stockPrice: { type: Number, default: 0 },
    marketCap: { type: Number, default: 0 },
  },
  { _id: false }
);

const TokenSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    stockCode: { type: String, required: true },
    totalSupply: { type: Number, default: 0 },
    circulatingSupply: { type: Number, default: 0 },
    decimals: { type: Number, default: 0 },
    treasuryAccountId: { type: String, required: true },
    metadata: { type: TokenMetadataSchema, default: {} },
  },
  { timestamps: true }
);

// Stock data - these are the tokens we'll create
const STOCKS = [
  {
    code: "KCB",
    name: "Kenya Commercial Bank Group Holdings",
    initialSupply: 1000000,
  },
  {
    code: "EQTY",
    name: "Equity Group Holdings",
    initialSupply: 1000000,
  },
  {
    code: "SCOM",
    name: "Safaricom LTD",
    initialSupply: 1000000,
  },
  {
    code: "EABL",
    name: "East African Breweries LTD",
    initialSupply: 1000000,
  },
];

// Connect to MongoDB
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return false;
  }
}

// Create a real token on the Hedera Testnet
async function createRealToken(stock, client, treasuryId, treasuryKey) {
  console.log(`Creating token for ${stock.name} (${stock.code})...`);

  // Create the token transaction
  const transaction = await new TokenCreateTransaction()
    .setTokenName(`${stock.name} Token`)
    .setTokenSymbol(stock.code)
    .setTokenType(TokenType.FUNGIBLE_COMMON)
    .setDecimals(0)
    .setInitialSupply(stock.initialSupply)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.INFINITE)
    .setSupplyKey(treasuryKey.publicKey)
    .freezeWith(client);

  // Sign with the treasury key
  const signedTx = await transaction.sign(treasuryKey);

  // Submit to a Hedera network
  const txResponse = await signedTx.execute(client);

  // Get the receipt
  const receipt = await txResponse.getReceipt(client);

  // Get the token ID
  const tokenId = receipt.tokenId;

  // Get the transaction status
  const transactionStatus = receipt.status;

  console.log(`Token ${stock.code} created with ID: ${tokenId.toString()}`);
  console.log(`Status: ${transactionStatus.toString()}`);

  return {
    tokenId: tokenId.toString(),
    status: transactionStatus.toString(),
  };
}

// Main function to create tokens
async function createTokens() {
  let client;
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Create Token model
    const Token = mongoose.model("Token", TokenSchema);

    // Delete existing tokens
    console.log("Deleting existing tokens...");
    const deleteResult = await Token.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} tokens from database`);

    // Your account ID and private key (from demoToken.js)
    const MY_ACCOUNT_ID = AccountId.fromString("0.0.5483001");
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
    );

    // Create client for testnet
    client = Client.forTestnet();
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    console.log("--------------------------------");
    console.log("Creating tokens on Hedera Testnet");
    console.log(`Treasury account: ${MY_ACCOUNT_ID.toString()}`);
    console.log("--------------------------------");

    // Create tokens for each stock
    for (const stock of STOCKS) {
      try {
        // Check if token already exists (just a double-check)
        const existingToken = await Token.findOne({ symbol: stock.code });
        if (existingToken) {
          console.log(
            `WARNING: Token for ${stock.code} still exists in DB with ID: ${existingToken.tokenId}`
          );
          // Continue anyway - we'll update it
        }

        // Create the token on Hedera
        const result = await createRealToken(
          stock,
          client,
          MY_ACCOUNT_ID,
          MY_PRIVATE_KEY
        );

        if (result.status === "SUCCESS") {
          // Create or update token record in database
          const token = new Token({
            tokenId: result.tokenId,
            name: `${stock.name} Token`,
            symbol: stock.code,
            stockCode: stock.code,
            decimals: 0,
            totalSupply: stock.initialSupply,
            circulatingSupply: stock.initialSupply,
            treasuryAccountId: MY_ACCOUNT_ID.toString(),
            metadata: {
              description: `Tokenized representation of ${stock.name} shares on the Nairobi Stock Exchange`,
            },
          });

          // Save to database
          await token.save();
          console.log(
            `Token for ${stock.code} saved to database with ID: ${result.tokenId}`
          );
        } else {
          console.error(
            `Failed to create token for ${stock.code}: Status ${result.status}`
          );
        }
      } catch (error) {
        console.error(`Error processing ${stock.code}:`, error.message);
      }

      console.log("--------------------------------");
    }

    console.log("Token creation process completed");
  } catch (error) {
    console.error("Error in token creation process:", error);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }

    // Close Hedera client
    if (client) {
      client.close();
      console.log("Hedera client closed");
    }
  }
}

// Run the script
createTokens();
