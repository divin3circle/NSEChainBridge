"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromHeader = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
/**
 * Generate JWT token for a user
 * @param user User object
 * @returns JWT token
 */
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id,
        email: user.email,
        name: user.name,
        hederaAccountId: user.hederaAccountId,
    }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};
exports.generateToken = generateToken;
/**
 * Verify JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Extract JWT token from authorization header
 * @param authHeader Authorization header
 * @returns JWT token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.split(" ")[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
