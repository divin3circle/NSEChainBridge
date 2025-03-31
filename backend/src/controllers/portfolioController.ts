import { Request, Response } from "express";
import portfolioService from "../services/portfolioService";

export const getPortfolioInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const accountId = req.user.hederaAccountId;
    const privateKey = req.user.hederaPrivateKey;

    if (!accountId || !privateKey) {
      return res
        .status(400)
        .json({ message: "Hedera account credentials required" });
    }

    const insights = await portfolioService.getPortfolioInsights(
      userId,
      accountId,
      privateKey
    );
    res.json(insights);
  } catch (error: any) {
    console.error("Error getting portfolio insights:", error);
    res.status(500).json({ message: error.message });
  }
};
