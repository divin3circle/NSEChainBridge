// routes/portfolioRoutes.ts
import express, { RequestHandler } from "express";
import { getPortfolioInsights } from "../controllers/portfolioController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// Protected routes
router.get("/insights", authMiddleware, getPortfolioInsights as RequestHandler);

export default router;
