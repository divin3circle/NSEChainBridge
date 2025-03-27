import mongoose from "mongoose";
import dotenv from "dotenv";
import Token from "../models/Token";
import { initializeStockTokens } from "./initializeStockTokens";

dotenv.config();

async function deleteAndReinitializeTokens() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    // Delete all existing tokens
    console.log("Deleting all existing tokens...");
    const deleteResult = await Token.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} tokens from database`);

    // Reinitialize stock tokens with correct treasury account
    console.log("Reinitializing tokens with correct treasury account...");
    console.log(`Using operator ID: ${process.env.HEDERA_OPERATOR_ID}`);
    await initializeStockTokens();

    console.log("Token deletion and reinitialization completed successfully");
  } catch (error) {
    console.error("Error in token deletion and reinitialization:", error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script if executed directly
if (require.main === module) {
  deleteAndReinitializeTokens()
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}
