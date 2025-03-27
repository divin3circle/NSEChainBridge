import express, { RequestHandler } from "express";
import { authMiddleware, requireHederaAccount } from "../middlewares/auth";
import {
  buyTokens,
  sellTokens,
  getUserTransactionHistory,
} from "../controllers/transactionController";

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

// Transaction routes
router.post("/buy", requireHederaAccount, buyTokens as RequestHandler);
router.post("/sell", requireHederaAccount, sellTokens as RequestHandler);
router.get("/history", getUserTransactionHistory as RequestHandler);

export default router;
