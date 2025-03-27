import { Request, Response } from "express";
import User from "../models/User";
import accountService from "../services/accountService";
import hederaService from "../services/hederaService";

export const createHederaAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.hederaAccountId) {
      return res
        .status(400)
        .json({ message: "User already has a Hedera account" });
    }

    // Create Hedera account
    const accountInfo = await hederaService.createAccount();

    // Update user with Hedera account info
    user.hederaAccountId = accountInfo.accountId;
    // Don't store private key in production - this is for demo only
    user.hederaPrivateKey = accountInfo.privateKey;
    user.hederaPublicKey = accountInfo.publicKey;
    await user.save();

    // Associate all tokens with the new account
    await accountService.associateAllTokensWithUser(userId);

    res.status(200).json({
      message: "Hedera account created successfully",
      accountId: accountInfo.accountId,
      publicKey: accountInfo.publicKey,
    });
  } catch (error: any) {
    console.error("Error creating Hedera account:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Associate all tokens with a user's Hedera account
 */
export const associateUserTokens = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const associationResults = await accountService.associateAllTokensWithUser(
      userId
    );

    res.status(200).json({
      message: "Tokens associated successfully",
      results: associationResults,
    });
  } catch (error: any) {
    console.error("Error associating tokens:", error);
    res.status(500).json({ message: error.message });
  }
};
