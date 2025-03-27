// This is a plain JavaScript file to avoid TypeScript configuration issues
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Configure environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Define Token schema
const TokenSchema = new mongoose.Schema(
  {
    tokenId: String,
    name: String,
    symbol: String,
    decimals: Number,
    totalSupply: Number,
    circulatingSupply: Number,
    treasuryAccountId: String,
    stockCode: String,
    metadata: {
      description: String,
      stockPrice: Number,
      marketCap: Number,
      peRatio: Number,
    },
  },
  { timestamps: true }
);

const Token = mongoose.model("Token", TokenSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB:`, error);
    process.exit(1);
  }
};

// Stock prices in KES
const STOCK_PRICES = {
  KCB: 29,
  EQTY: 30,
  SCOM: 19,
  EABL: 240,
};

// HBAR price in KES
const HBAR_PRICE_KES = 24.51;

/**
 * Update stock prices in the token database
 */
const updateStockPrices = async () => {
  try {
    // Connect to database
    const conn = await connectDB();

    // Update each stock token
    for (const [stockCode, priceKES] of Object.entries(STOCK_PRICES)) {
      // Find token by stock code (symbol)
      const token = await Token.findOne({ symbol: stockCode });

      if (!token) {
        console.log(`Token for ${stockCode} not found in database`);
        continue;
      }

      // Ensure metadata object exists
      if (!token.metadata) {
        token.metadata = {
          description: `Token for ${stockCode}`,
          stockPrice: 0,
          marketCap: 0,
          peRatio: 0,
        };
      }

      // Update stock price
      token.metadata.stockPrice = priceKES;

      // Calculate market cap based on circulating supply
      const circulatingSupply = token.circulatingSupply || 0;
      token.metadata.marketCap = circulatingSupply * priceKES;

      // Save updates
      await token.save();

      console.log(`Updated ${stockCode} price to ${priceKES} KES`);
    }

    console.log("Stock prices updated successfully");

    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error updating stock prices:", error);
  }
};

// Run the script
updateStockPrices();
