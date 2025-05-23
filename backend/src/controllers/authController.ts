import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import accountService from "../services/accountService";
import Token from "../models/Token";
import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TransferTransaction,
  Status,
} from "@hashgraph/sdk";

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
      const hederaService = (await import("../services/hederaService")).default;
      accountInfo = await hederaService.createAccount();
    } catch (error) {
      console.warn(
        "Falling back to accountService for account creation:",
        error
      );
      accountInfo = await accountService.createAccount();
    }

    user.hederaAccountId = accountInfo.accountId;
    user.privateKey = accountInfo.privateKey;

    // fund user 10HBAR to user's account
    const HEDERA_OPERATOR_ID = AccountId.fromString("0.0.5483001");
    const HEDERA_OPERATOR_KEY = PrivateKey.fromStringECDSA(
      "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
    );
    const myAccountId = HEDERA_OPERATOR_ID;
    const myPrivateKey = HEDERA_OPERATOR_KEY;

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(myAccountId, new Hbar(-10))
      .addHbarTransfer(user.hederaAccountId, new Hbar(10));

    const txTransferResponse = await txTransfer.execute(client);
    const receiptTransferTx = await txTransferResponse.getReceipt(client);
    const statusTransferTx = receiptTransferTx.status;
    const txIdTransfer = txTransferResponse.transactionId.toString();

    // Check if transaction was successful
    if (statusTransferTx !== Status.Success) {
      throw new Error(`HBAR transfer failed with status: ${statusTransferTx}`);
    }

    console.log(
      "-------------------------------- Transfer HBAR ------------------------------ "
    );
    console.log("Receipt status           :", statusTransferTx.toString());
    console.log("Transaction ID           :", txIdTransfer);
    console.log(
      "Hashscan URL             :",
      `https://hashscan.io/testnet/tx/${txIdTransfer}`
    );

    // Create or find HBAR token
    let hbarToken = await Token.findOne({ tokenId: "HBAR" });
    if (!hbarToken) {
      hbarToken = await Token.create({
        tokenId: "HBAR",
        symbol: "HBAR",
        name: "Hedera Testnet",
        decimals: 18,
        totalSupply: "",
        stockCode: "HBAR",
        treasuryAccountId: "0.0.5483001", // Add treasury account ID
      });
    }

    // Add HBAR to user's token holdings
    user.tokenHoldings.push({
      tokenId: "HBAR",
      balance: 10,
      lockedQuantity: 0,
    });

    if ("publicKey" in accountInfo) {
      user.hederaPublicKey = accountInfo.publicKey as string;
    }

    await user.save();

    res.status(201).json({
      message: "Hedera account created successfully",
      hederaAccountId: accountInfo.accountId,
      privateKey: accountInfo.privateKey,
      publicKey: accountInfo.publicKey || user.hederaPublicKey,
      balance: 10, // Add initial HBAR balance to response
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
          symbol: token?.symbol || "HBAR",
          name: token?.name || "Hedera Testnet",
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
