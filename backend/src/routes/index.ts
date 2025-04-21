// routes/index.ts
import express from "express";
import userRoutes from "./userRoutes";
import stockRoutes from "./stockRoutes";
import portfolioRoutes from "./portfolioRoutes";
import marketInsightsRoutes from "./marketInsightsRoutes";
import topicRoutes from "./topicRoutes";

const router = express.Router();

router.use("/auth", userRoutes);
router.use("/stocks", stockRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/market-insights", marketInsightsRoutes);
router.use("/topics", topicRoutes);

export default router;
