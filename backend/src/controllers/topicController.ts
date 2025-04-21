import { Request, Response } from "express";
import Topic, { IMessage } from "../models/Topics";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new topic
 * @route POST /api/topics
 */
export const createTopic = async (req: Request, res: Response) => {
  try {
    const { name, description, topicMemo, hederaTopicID } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const topic = new Topic({
      userId,
      name,
      description,
      topicId: uuidv4(),
      hederaTopicID,
      topicMemo,
      messages: [],
    });

    await topic.save();

    res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (error: any) {
    console.error("Error creating topic:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all topics
 * @route GET /api/topics
 */
export const getTopics = async (req: Request, res: Response) => {
  try {
    const topics = await Topic.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ topics });
  } catch (error: any) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a specific topic by ID
 * @route GET /api/topics/:id
 */
export const getTopicById = async (req: Request, res: Response) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate("userId", "name email")
      .populate("messages.sender", "name email");

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.status(200).json({ topic });
  } catch (error: any) {
    console.error("Error fetching topic:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a topic by Hedera Topic ID
 * @route GET /api/topics/hedera/:hederaTopicID
 */
export const getTopicByHederaId = async (req: Request, res: Response) => {
  try {
    const { hederaTopicID } = req.params;
    const topic = await Topic.findOne({ hederaTopicID })
      .populate("userId", "name email")
      .populate("messages.sender", "name email");

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.status(200).json({ topic });
  } catch (error: any) {
    console.error("Error fetching topic by Hedera ID:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get topics by user ID
 * @route GET /api/topics/user/:userId
 */
export const getTopicsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const topics = await Topic.find({ userId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ topics });
  } catch (error: any) {
    console.error("Error fetching user topics:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add a message to a topic
 * @route POST /api/topics/:id/messages
 */
export const addMessage = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user?.id;
    const topicId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const newMessage = {
      content,
      sender: userId,
    };

    topic.messages.push(newMessage as IMessage);
    await topic.save();

    // Populate sender information in the response
    await topic.populate("messages.sender", "name email");

    res.status(201).json({
      message: "Message added successfully",
      topic,
    });
  } catch (error: any) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add a message to a topic using Hedera Topic ID
 * @route POST /api/topics/hedera/:hederaTopicID/messages
 */
export const addMessageByHederaId = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user?.id;
    const { hederaTopicID } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const topic = await Topic.findOne({ hederaTopicID });
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const newMessage = {
      content,
      sender: userId,
    };

    topic.messages.push(newMessage as IMessage);
    await topic.save();

    // Populate sender information in the response
    await topic.populate("messages.sender", "name email");

    res.status(201).json({
      message: "Message added successfully",
      topic,
    });
  } catch (error: any) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add a message to the first topic of a user's topic array
 * @route POST /api/topics/user/:userId/messages
 */
export const addMessageToUserFirstTopic = async (
  req: Request,
  res: Response
) => {
  try {
    const { content } = req.body;
    const { userId } = req.params;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find the first topic for the user
    const topic = await Topic.findOne({ userId }).sort({ createdAt: 1 }); // Get the oldest topic first

    if (!topic) {
      return res.status(404).json({ message: "No topics found for this user" });
    }

    const newMessage = {
      content,
      sender: senderId,
    };

    topic.messages.push(newMessage as IMessage);
    await topic.save();

    // Populate sender information in the response
    await topic.populate("messages.sender", "name email");

    res.status(201).json({
      message: "Message added successfully to user's first topic",
      topic,
    });
  } catch (error: any) {
    console.error("Error adding message to user's first topic:", error);
    res.status(500).json({ message: error.message });
  }
};
