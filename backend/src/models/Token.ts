import mongoose, { Schema, Document } from "mongoose";

export interface ITokenMetadata {
  description: string;
  stockPrice: number; // Price in KES
  marketCap: number;
  peRatio?: number;
  volume24h?: number;
  yearHigh?: number;
  yearLow?: number;
  dividend?: number;
  imageUrl?: string;
}

export interface IToken extends Document {
  tokenId: string; // Hedera token ID
  name: string; // Token name
  symbol: string; // Token symbol (usually same as stock code)
  stockCode: string; // NSE stock code (e.g., KCB, EQTY)
  totalSupply: number; // Total supply of tokens
  circulatingSupply: number; // Circulating supply of tokens
  decimals: number; // Number of decimal places
  treasuryAccountId: string; // Hedera account ID of the treasury
  adminKey?: string; // Admin key (encrypted)
  metadata: ITokenMetadata; // Additional token information
  createdAt: Date;
  updatedAt: Date;
}

const TokenMetadataSchema = new Schema(
  {
    description: {
      type: String,
      default: "",
    },
    stockPrice: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
    },
    peRatio: {
      type: Number,
    },
    volume24h: {
      type: Number,
    },
    yearHigh: {
      type: Number,
    },
    yearLow: {
      type: Number,
    },
    dividend: {
      type: Number,
    },
    imageUrl: {
      type: String,
    },
  },
  { _id: false }
);

const TokenSchema: Schema = new Schema(
  {
    tokenId: {
      type: String,
      required: [true, "Token ID is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Token name is required"],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, "Token symbol is required"],
      trim: true,
    },
    stockCode: {
      type: String,
      required: [true, "Stock code is required"],
      trim: true,
    },
    totalSupply: {
      type: Number,
      required: [true, "Total supply is required"],
      default: 0,
    },
    circulatingSupply: {
      type: Number,
      required: [true, "Circulating supply is required"],
      default: 0,
    },
    decimals: {
      type: Number,
      required: [true, "Decimals is required"],
      default: 0,
    },
    treasuryAccountId: {
      type: String,
      required: [true, "Treasury account ID is required"],
      trim: true,
    },
    adminKey: {
      type: String,
      select: false, // Never return this by default for security
    },
    metadata: {
      type: TokenMetadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Token = mongoose.model<IToken>("Token", TokenSchema);

export default Token;
