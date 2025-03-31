// routes/userRoutes.ts
import express, { RequestHandler } from "express";
import {
  createHederaAccount,
  associateUserTokens,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// Protected routes that require authentication
router.post(
  "/hedera-account",
  authMiddleware,
  createHederaAccount as RequestHandler
);
router.post(
  "/associate-tokens",
  authMiddleware,
  associateUserTokens as RequestHandler
);

export default router;
