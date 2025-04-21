import express, { RequestHandler } from "express";
import {
  createTopic,
  getTopics,
  getTopicById,
  addMessage,
  getTopicsByUserId,
  getTopicByHederaId,
  addMessageByHederaId,
  addMessageToUserFirstTopic,
} from "../controllers/topicController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new topic
router.post("/", createTopic as RequestHandler);

// Get all topics
router.get("/", getTopics as RequestHandler);

// Get topics by user ID
router.get("/user/:userId", getTopicsByUserId as RequestHandler);

// Add message to user's first topic
router.post(
  "/user/:userId/messages",
  addMessageToUserFirstTopic as RequestHandler
);

// Get topic by Hedera ID
router.get("/hedera/:hederaTopicID", getTopicByHederaId as RequestHandler);

// Add message to topic by Hedera ID
router.post(
  "/hedera/:hederaTopicID/messages",
  addMessageByHederaId as RequestHandler
);

// Get a specific topic
router.get("/:id", getTopicById as RequestHandler);

// Add a message to a topic
router.post("/:id/messages", addMessage as RequestHandler);

export default router;
