import mongoose from "mongoose";
import dotenv from "dotenv";
import tokenService from "../services/tokenService";

dotenv.config();

const STOCKS = [
  {
    code: "KCB",
    name: "Kenya Commercial Bank",
    initialSupply: 1000000,
  },
  {
    code: "EQTY",
    name: "Equity Group Holdings",
    initialSupply: 1000000,
  },
  {
    code: "SCOM",
    name: "Safaricom",
    initialSupply: 1000000,
  },
  {
    code: "EABL",
    name: "East African Breweries",
    initialSupply: 1000000,
  },
  {
    code: "USDC",
    name: "USDC",
    initialSupply: 900000000,
  },
];

export async function initializeStockTokens() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    // Initialize each stock token
    for (const stock of STOCKS) {
      try {
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

        // Create new token
        const token = await tokenService.createStockToken(
          stock.code,
          stock.name,
          stock.initialSupply
        );

        console.log(
          `Created token for ${stock.code} with ID: ${token.tokenId}`
        );
      } catch (error) {
        console.error(`Error creating token for ${stock.code}:`, error);
      }
    }

    console.log("Stock token initialization completed");
  } catch (error) {
    console.error("Error initializing stock tokens:", error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  initializeStockTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
