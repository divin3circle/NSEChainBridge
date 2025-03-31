// routes/marketInsightsRoutes.ts
import express, { RequestHandler } from "express";
import {
  getStockSentiment,
  submitMarketInsight,
  getRecentInsights,
} from "../controllers/marketInsightsController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// Public routes
router.get(
  "/stocks/:stockCode/sentiment",
  authMiddleware,
  getStockSentiment as RequestHandler
);
router.get("/stocks/:stockCode/insights", getRecentInsights as RequestHandler);

// Protected routes
router.post(
  "/stocks/:stockCode/insights",
  authMiddleware,
  submitMarketInsight as RequestHandler
);

export default router;
