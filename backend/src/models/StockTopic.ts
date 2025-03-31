// models/StockTopic.ts
import mongoose from "mongoose";

const StockTopicSchema = new mongoose.Schema({
  stockCode: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  topicId: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("StockTopic", StockTopicSchema);
