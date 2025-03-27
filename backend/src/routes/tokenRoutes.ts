import express, { RequestHandler } from "express";
import {
  getAllTokens,
  getTokenById,
  createStockToken,
  mintStockTokens,
  burnStockTokens,
  getUserTokenBalances,
  verifyUserBurnTransaction,
} from "../controllers/tokenController";
import { sellTokensForHbar } from "../controllers/sellTokensController";
import { authMiddleware, requireHederaAccount } from "../middlewares/auth";

const router = express.Router();

// Public routes
router.get("/", getAllTokens as RequestHandler);
router.get("/:id", getTokenById as RequestHandler);

// Protected routes
router.use(authMiddleware);

// Get user token balances
router.get("/balances", getUserTokenBalances as RequestHandler);

// Admin route - protected and requires special privileges
router.post("/create", createStockToken as RequestHandler);

// User token operations - require Hedera account
router.post(
  "/:stockCode/mint",
  requireHederaAccount,
  mintStockTokens as RequestHandler
);
router.post(
  "/:stockCode/burn",
  requireHederaAccount,
  burnStockTokens as RequestHandler
);
router.post(
  "/:stockCode/verify-burn",
  requireHederaAccount,
  verifyUserBurnTransaction as RequestHandler
);
router.post(
  "/:stockCode/sell",
  requireHederaAccount,
  sellTokensForHbar as RequestHandler
);

export default router;
