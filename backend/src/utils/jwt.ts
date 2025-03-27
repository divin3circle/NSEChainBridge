import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { IUser } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Generate JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      hederaAccountId: user.hederaAccountId,
    },
    JWT_SECRET as Secret,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );
};

/**
 * Verify JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET as Secret);
  } catch (error) {
    return null;
  }
};

/**
 * Extract JWT token from authorization header
 * @param authHeader Authorization header
 * @returns JWT token or null if not found
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};
