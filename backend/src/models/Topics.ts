import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  content: string;
  sender: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITopic extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  topicId: string;
  hederaTopicID: string;
  messages: IMessage[];
  topicMemo: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [1000, "Message cannot be longer than 1000 characters"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message sender is required"],
    },
  },
  {
    timestamps: true,
  }
);

const TopicSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Topic name is required"],
      trim: true,
      maxlength: [100, "Topic name cannot be longer than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Topic description is required"],
      trim: true,
      maxlength: [500, "Description cannot be longer than 500 characters"],
    },
    topicId: {
      type: String,
      required: [true, "Topic ID is required"],
      trim: true,
      unique: true,
      index: true,
    },
    hederaTopicID: {
      type: String,
      required: [true, "Hedera Topic ID is required"],
      trim: true,
      unique: true,
    },
    messages: [MessageSchema],
    topicMemo: {
      type: String,
      required: [true, "Topic memo is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster message queries
TopicSchema.index({ "messages.createdAt": -1 });

// Index for topic search
TopicSchema.index({ name: "text", description: "text" });

// Pre-save hook to ensure topicId is unique
TopicSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingTopic = await Topic.findOne({ topicId: this.topicId });
    if (existingTopic) {
      throw new Error("Topic ID must be unique");
    }
  }
  next();
});

const Topic = mongoose.model<ITopic>("Topic", TopicSchema);

export default Topic;
