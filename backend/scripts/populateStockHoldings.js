require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Import User model
const userModelPath = path.join(__dirname, "../src/models/User");
const User = require(userModelPath);

// Available stock codes
const stockCodes = ["KCB", "EQTY", "SCOM", "EABL"];

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

// Generate random number between min and max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Add random stock holdings to users
async function populateStockHoldings() {
  try {
    const connected = await connectDB();
    if (!connected) return;

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      console.log(`Updating user: ${user.name} (${user.email})`);

      // Generate random stock holdings
      const holdings = [];
      for (const stockCode of stockCodes) {
        holdings.push({
          stockCode,
          quantity: getRandomInt(2000, 5000),
          lockedQuantity: 0,
        });
      }

      // Update user stock holdings
      user.stockHoldings = holdings;
      await user.save();

      console.log(`Updated stock holdings for user ${user.email}:`);
      console.log(holdings);
    }

    console.log("Stock holdings updated successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating stock holdings:", error);
    mongoose.connection.close();
  }
}

// Run the script
populateStockHoldings();
