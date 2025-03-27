import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/authRoutes";
import tokenRoutes from "./routes/tokenRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import { initializeStockTokens } from "./scripts/initializeStockTokens";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/transactions", transactionRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to NSEChainBridge API" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Initialize stock tokens
    try {
      await initializeStockTokens();
      console.log("Stock tokens initialized successfully");
    } catch (error) {
      console.error("Error initializing stock tokens:", error);
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
