import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

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

// Stock data
const stocks = [
  { code: "KCB", name: "KCB Group" },
  { code: "EQTY", name: "Equity Group" },
  { code: "SCOM", name: "Safaricom" },
  { code: "EABL", name: "East African Breweries" },
];

// Main function
async function createTokens() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Create Token model
    const Token = mongoose.model("Token", TokenSchema);
    console.log("Token model created");

    // Create tokens for each stock
    for (const stock of stocks) {
      try {
        console.log(`Processing ${stock.name} (${stock.code})...`);

        // Check if token already exists
        const existingToken = await Token.findOne({ symbol: stock.code });
        if (existingToken) {
          console.log(
            `Token for ${stock.code} already exists with ID: ${existingToken.tokenId}`
          );
          continue;
        }

        // Generate mock token ID
        const tokenId = `0.0.${Math.floor(100000 + Math.random() * 900000)}`;

        // Create new token
        const token = new Token({
          tokenId,
          name: `${stock.name} Token`,
          symbol: stock.code,
          stockCode: stock.code,
          decimals: 0,
          treasuryAccountId: "0.0.12345",
          metadata: {
            description: `Tokenized representation of ${stock.name} shares on NSE`,
          },
        });

        // Save to database
        await token.save();
        console.log(`Created token for ${stock.code} with ID: ${tokenId}`);
      } catch (error) {
        console.error(`Error processing ${stock.code}:`, error);
      }
    }

    console.log("All tokens created successfully");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the script
createTokens();
