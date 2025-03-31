// routes/stockRoutes.ts
import express, { RequestHandler } from "express";
import { getTokenByStockCode } from "../controllers/tokenController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// Public routes
router.get("/:stockCode/token", getTokenByStockCode as RequestHandler);

export default router;
