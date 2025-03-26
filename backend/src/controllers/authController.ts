import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import accountService from "../services/accountService";

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error during registration", error });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hederaAccountId: user.hederaAccountId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login", error });
  }
};

/**
 * Create Hedera account for user
 * @route POST /api/auth/create-hedera-account
 */
export const createHederaAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has a Hedera account
    if (user.hederaAccountId) {
      return res.status(400).json({
        message: "User already has a Hedera account",
        hederaAccountId: user.hederaAccountId,
      });
    }

    // Create Hedera account
    const { accountId, privateKey } = await accountService.createAccount();

    // Update user with Hedera account
    user.hederaAccountId = accountId;
    user.privateKey = privateKey; // Note: In production, encrypt this

    await user.save();

    res.status(201).json({
      message: "Hedera account created successfully",
      hederaAccountId: accountId,
    });
  } catch (error) {
    console.error("Hedera account creation error:", error);
    res.status(500).json({ message: "Error creating Hedera account", error });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hederaAccountId: user.hederaAccountId,
        stockHoldings: user.stockHoldings,
        tokenHoldings: user.tokenHoldings,
      },
    });
  } catch (error) {
    console.error("Get current user error: ", error);
    res.status(500).json({ message: "Error getting current user: ", error });
  }
};
