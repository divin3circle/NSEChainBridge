import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import accountService from "../services/accountService";
import Token from "../models/Token";

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
        privateKey: user.privateKey,
        hederaPublicKey: user.hederaPublicKey,
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
        privateKey: user.privateKey,
        publicKey: user.hederaPublicKey,
      });
    }

    // Create Hedera account
    let accountInfo;
    try {
      // Try using hederaService first (which has better mock support)
      const hederaService = (await import("../services/hederaService")).default;
      accountInfo = await hederaService.createAccount();
    } catch (error) {
      // Fall back to accountService if hederaService fails
      console.warn(
        "Falling back to accountService for account creation:",
        error
      );
      accountInfo = await accountService.createAccount();
    }

    user.hederaAccountId = accountInfo.accountId;
    user.privateKey = accountInfo.privateKey;

    if ("publicKey" in accountInfo) {
      user.hederaPublicKey = accountInfo.publicKey as string;
    }

    await user.save();

    res.status(201).json({
      message: "Hedera account created successfully",
      hederaAccountId: accountInfo.accountId,
      privateKey: accountInfo.privateKey,
      publicKey: accountInfo.publicKey || user.hederaPublicKey,
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
    console.log(`Getting profile for user: ${userId}`);

    // Fetch all user details including token holdings and populate token details
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User found, token holdings:`, user.tokenHoldings);

    // If user has token holdings, get token details
    interface TokenDetail {
      tokenId: string;
      symbol: string;
      name: string;
      balance: number;
      stockCode: string | null;
    }

    let tokenDetails: TokenDetail[] = [];
    if (user.tokenHoldings && user.tokenHoldings.length > 0) {
      // Get token IDs from holdings
      const tokenIds = user.tokenHoldings.map((holding) => holding.tokenId);

      // Fetch token details
      const tokens = await Token.find({ tokenId: { $in: tokenIds } });
      console.log(`Found ${tokens.length} tokens for the user`);

      // Combine token details with user holdings
      tokenDetails = user.tokenHoldings.map((holding) => {
        const token = tokens.find((t) => t.tokenId === holding.tokenId);
        return {
          tokenId: holding.tokenId,
          symbol: token?.symbol || "UNKNOWN",
          name: token?.name || "Unknown Token",
          balance: holding.balance,
          stockCode: token?.stockCode || null,
        };
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hederaAccountId: user.hederaAccountId,
        stockHoldings: user.stockHoldings,
        tokenHoldings: user.tokenHoldings,
        tokens: tokenDetails, // Add the enhanced token details
      },
    });
  } catch (error) {
    console.error("Get current user error: ", error);
    res.status(500).json({ message: "Error getting current user: ", error });
  }
};
