import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  hederaAccountId?: string; // Hedera account ID associated with user
  privateKey?: string; // Encrypted private key (handle with extreme care)
  hederaPrivateKey?: string; // For development only, should not be used in production
  hederaPublicKey?: string; // Public key for Hedera account
  stockHoldings: {
    stockCode: string;
    quantity: number;
    lockedQuantity: number; // Amount locked for tokens
  }[];
  tokenHoldings: {
    tokenId: string;
    balance: number;
    lockedQuantity: number; // Amount locked for tokens
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    hederaAccountId: {
      type: String,
      sparse: true,
      trim: true,
    },
    privateKey: {
      type: String,
      select: false, // Never return this by default for security
    },
    hederaPrivateKey: {
      type: String,
      select: false, // Never return this by default for security
    },
    hederaPublicKey: {
      type: String,
      sparse: true,
    },
    stockHoldings: [
      {
        stockCode: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 0,
        },
        lockedQuantity: {
          type: Number,
          default: 0,
          required: true,
        },
      },
    ],
    tokenHoldings: [
      {
        tokenId: {
          type: String,
          required: true,
        },
        balance: {
          type: Number,
          required: true,
          default: 0,
        },
        lockedQuantity: {
          type: Number,
          default: 0,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
