const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Connect to MongoDB
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI environment variable is not defined!");
      console.error(
        "Please make sure your .env file contains the MONGODB_URI variable"
      );
      console.error("Current .env path:", path.resolve(__dirname, "../.env"));
      console.error(
        "Current environment variables:",
        Object.keys(process.env).join(", ")
      );
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    console.log("Connecting to MongoDB...");
    console.log("Using MongoDB URI:", uri.replace(/:([^:@]+)@/, ":****@")); // Hide password in logs
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return false;
  }
}

// Define a simplified User Schema just for this script
const StockHoldingSchema = new mongoose.Schema(
  {
    stockCode: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    lockedQuantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    stockHoldings: [StockHoldingSchema],
  },
  { timestamps: true }
);

// Available stock codes
const stockCodes = ["KCB", "EQTY", "SCOM", "EABL"];

// Generate random number between min and max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Main function
async function populateStockHoldings() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Create User model
    let User;
    try {
      User = mongoose.model("User");
    } catch (e) {
      User = mongoose.model("User", UserSchema);
    }
    console.log("User model created");

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    if (users.length === 0) {
      console.log("No users found. Please create users first.");
      return;
    }

    // Update each user with random stock holdings
    for (const user of users) {
      console.log(`Updating user: ${user.name || "Unnamed"} (${user.email})`);

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
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the script
populateStockHoldings();
