import mongoose from "mongoose";

const MarketInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stockCode: {
    type: String,
    required: true,
    trim: true,
  },
  topicId: {
    type: String,
    required: true,
    trim: true,
  },
  messageId: {
    type: String,
    trim: true,
  },
  insightType: {
    type: String,
    enum: ["technical", "fundamental", "news", "prediction"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("MarketInsight", MarketInsightSchema);
