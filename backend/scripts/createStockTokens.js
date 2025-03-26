require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Import token service (with ES module workaround for CommonJS)
async function importTokenService() {
  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    return require("../dist/services/tokenService").default;
  } catch (error) {
    console.error("Error importing token service:", error);
    process.exit(1);
  }
}

// Stock data
const stocks = [
  { code: "KCB", name: "KCB Group" },
  { code: "EQTY", name: "Equity Group" },
  { code: "SCOM", name: "Safaricom" },
  { code: "EABL", name: "East African Breweries" },
];

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected...");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return false;
  }
}

// Create tokens for all stocks
async function createStockTokens() {
  try {
    const connected = await connectDB();
    if (!connected) return;

    // Import token service
    const tokenService = await importTokenService();

    // Create tokens for each stock
    for (const stock of stocks) {
      try {
        console.log(`Creating token for ${stock.name} (${stock.code})...`);

        // Check if token already exists
        const existingToken = await tokenService.getTokenByStockCode(
          stock.code
        );
        if (existingToken) {
          console.log(
            `Token for ${stock.code} already exists with ID: ${existingToken.tokenId}`
          );
          continue;
        }

        // Create token
        const token = await tokenService.createStockToken(
          stock.code,
          stock.name
        );
        console.log(
          `Created token for ${stock.code} with ID: ${token.tokenId}`
        );
      } catch (error) {
        console.error(`Error creating token for ${stock.code}:`, error);
      }
    }

    console.log("Stock tokens created successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error creating stock tokens:", error);
    mongoose.connection.close();
  }
}

// Run the script
createStockTokens();
