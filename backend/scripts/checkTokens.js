const {
  AccountId,
  PrivateKey,
  Client,
  TokenInfoQuery,
  TokenId,
} = require("@hashgraph/sdk");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Define Token Schema for the database
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

// Get token info from Hedera network
async function getTokenInfo(tokenId, client) {
  try {
    console.log(`Querying Hedera network for token: ${tokenId}`);
    const query = new TokenInfoQuery().setTokenId(TokenId.fromString(tokenId));
    const tokenInfo = await query.execute(client);
    return tokenInfo;
  } catch (error) {
    console.error(`Error getting token info for ${tokenId}:`, error.message);
    return null;
  }
}

// Check tokens in database and on Hedera
async function checkTokens() {
  let client;
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Create Token model
    const Token = mongoose.model("Token", TokenSchema);

    // Get all tokens from database
    const tokens = await Token.find({});
    console.log(`Found ${tokens.length} tokens in database`);

    // Your account ID and private key
    const MY_ACCOUNT_ID = AccountId.fromString("0.0.5483001");
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
    );

    // Create client for testnet
    client = Client.forTestnet();
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    console.log("--------------------------------");
    console.log("Checking tokens on Hedera Testnet");
    console.log(`Operator account: ${MY_ACCOUNT_ID.toString()}`);
    console.log("--------------------------------");

    // Check each token
    for (const token of tokens) {
      console.log(`\nToken: ${token.name} (${token.symbol})`);
      console.log(`Database Info:`);
      console.log(`- ID: ${token.tokenId}`);
      console.log(`- Treasury Account: ${token.treasuryAccountId}`);
      console.log(`- Total Supply: ${token.totalSupply}`);
      console.log(`- Circulating Supply: ${token.circulatingSupply}`);

      // Get info from Hedera
      const hederaInfo = await getTokenInfo(token.tokenId, client);

      if (hederaInfo) {
        console.log(`Hedera Network Info:`);
        console.log(`- Name: ${hederaInfo.name}`);
        console.log(`- Symbol: ${hederaInfo.symbol}`);
        console.log(`- Total Supply: ${hederaInfo.totalSupply.toString()}`);
        console.log(`- Treasury: ${hederaInfo.treasuryAccountId.toString()}`);
        console.log(
          `- Supply Key: ${
            hederaInfo.supplyKey ? hederaInfo.supplyKey.toString() : "None"
          }`
        );
        console.log(`- Token Type: ${hederaInfo.tokenType}`);

        // Verify treasury account matches
        if (
          hederaInfo.treasuryAccountId.toString() === token.treasuryAccountId
        ) {
          console.log(`✅ Treasury account matches`);
        } else {
          console.log(`❌ Treasury accounts don't match!`);
          console.log(`   DB: ${token.treasuryAccountId}`);
          console.log(`   Hedera: ${hederaInfo.treasuryAccountId.toString()}`);
        }

        // Check if supply key is present
        if (hederaInfo.supplyKey) {
          console.log(`✅ Supply key is present - can mint tokens`);
        } else {
          console.log(`❌ No supply key - cannot mint tokens!`);
        }
      } else {
        console.log(`❌ Could not retrieve token info from Hedera network`);
      }

      console.log("--------------------------------");
    }
  } catch (error) {
    console.error("Error checking tokens:", error);
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
checkTokens();
