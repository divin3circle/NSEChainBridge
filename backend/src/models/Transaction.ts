import mongoose, { Schema, Document } from "mongoose";

export enum TransactionType {
  MINT = "MINT",
  BURN = "BURN",
  TRANSFER = "TRANSFER",
  SELL = "SELL",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  tokenId: string;
  stockCode: string;
  amount: number;
  hederaTransactionId: string;
  type: TransactionType;
  status: TransactionStatus;
  fee: number;
  paymentTokenId: string;
  paymentAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    tokenId: {
      type: String,
      required: [true, "Token ID is required"],
      trim: true,
    },
    stockCode: {
      type: String,
      required: [true, "Stock code is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    hederaTransactionId: {
      type: String,
      required: false,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, "Transaction type is required"],
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    fee: {
      type: Number,
      required: [true, "Fee is required"],
      default: 0,
    },
    paymentTokenId: {
      type: String,
      required: [true, "Payment token ID is required"],
      trim: true,
    },
    paymentAmount: {
      type: Number,
      required: [true, "Payment amount is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

export default Transaction;
