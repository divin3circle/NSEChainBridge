import express, { RequestHandler } from "express";
import {
  getAllTokens,
  getTokenById,
  createStockToken,
  mintStockTokens,
  burnStockTokens,
} from "../controllers/tokenController";
import { authMiddleware, requireHederaAccount } from "../middlewares/auth";

const router = express.Router();

// Public routes
router.get("/", getAllTokens as RequestHandler);
router.get("/:id", getTokenById as RequestHandler);

// Protected routes
router.use(authMiddleware);

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

export default router;
