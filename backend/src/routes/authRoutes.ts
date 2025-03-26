import express, { RequestHandler } from "express";
import {
  register,
  login,
  createHederaAccount,
  getCurrentUser,
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// Public routes
router.post("/register", register as RequestHandler);
router.post("/login", login as RequestHandler);

// Protected routes
router.post(
  "/create-hedera-account",
  authMiddleware,
  createHederaAccount as RequestHandler
);
router.get("/me", authMiddleware, getCurrentUser as RequestHandler);

export default router;
