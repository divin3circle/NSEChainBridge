import { Request, Response } from "express";
import User from "../models/User";
import StockTopic from "../models/StockTopic";
import hcsService from "../services/hcsService";
import { simulatedStockData } from "../data/simulatedMarketData";

// Get market sentiment for a specific stock
export const getStockSentiment = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;

    // Get sentiment analysis from HCS
    const sentiment = await hcsService.analyzeStockSentiment(stockCode);

    // Get market data for the stock
    const marketData = simulatedStockData[stockCode];
    if (!marketData) {
      return res
        .status(404)
        .json({ message: `No market data found for ${stockCode}` });
    }

    // Combine sentiment and market data
    const response = {
      stockName: marketData.name,
      currentPrice: marketData.currentPrice,
      change: marketData.change,
      changePercent: marketData.changePercent,
      sentiment: {
        bullishPercentage: sentiment.bullishPercentage,
        bearishPercentage: sentiment.bearishPercentage,
        neutralPercentage: sentiment.neutralPercentage,
      },
      recentInsights: sentiment.latestInsights.map((insight: any) => ({
        content: insight.content,
        timestamp: insight.timestamp,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error getting stock sentiment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Submit a new market insight
export const submitMarketInsight = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    const { insightType, content, accountId, privateKey } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content is required" });
    }

    if (
      !insightType ||
      !["technical", "fundamental", "news", "prediction"].includes(insightType)
    ) {
      return res.status(400).json({
        message:
          "Valid insight type is required (technical, fundamental, news, prediction)",
      });
    }

    if (!accountId || !privateKey) {
      return res
        .status(400)
        .json({ message: "Hedera credentials are required" });
    }

    // Check if stockCode exists in our data
    if (!simulatedStockData[stockCode]) {
      return res.status(404).json({ message: `Stock ${stockCode} not found` });
    }

    // Create topic if it doesn't exist
    const topic = await StockTopic.findOne({ stockCode });
    if (!topic) {
      await hcsService.createTopicForStock(
        stockCode,
        `Market insights for ${stockCode}`
      );
    }

    // Submit the insight
    const result = await hcsService.submitInsight(
      userId,
      stockCode,
      insightType,
      content,
      accountId,
      privateKey
    );

    res.status(201).json({
      message: "Market insight submitted successfully",
      messageId: result.messageId,
      status: result.status,
      stockCode,
      insightType,
      content,
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    console.error("Error submitting market insight:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent insights for a stock
export const getRecentInsights = async (req: Request, res: Response) => {
  try {
    const { stockCode } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    // Check if stockCode exists in our data
    if (!simulatedStockData[stockCode]) {
      return res.status(404).json({ message: `Stock ${stockCode} not found` });
    }

    // Create topic if it doesn't exist
    const topic = await StockTopic.findOne({ stockCode });
    if (!topic) {
      await hcsService.createTopicForStock(
        stockCode,
        `Market insights for ${stockCode}`
      );
    }

    const insights = await hcsService.getInsightsForStock(stockCode, limit);

    res.status(200).json(insights);
  } catch (error: any) {
    console.error("Error getting recent insights:", error);
    res.status(500).json({ message: error.message });
  }
};
