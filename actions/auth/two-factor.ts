/**
 * @fileoverview Two-factor authentication related Server Actions
 * @module actions/auth/two-factor
 * @description Handles generation, verification and management of two-factor authentication tokens
 */

"use server";

import { db } from "@/lib/db";
import { TwoFactorToken } from "@prisma/client";
import { logger } from "@/lib/serverLogger";
import { generateToken } from "@/lib/crypto";

/**
 * Get two-factor authentication token by token value
 * @async
 * @function getTwoFactorTokenByToken
 * @param {string} token - Token value to query
 * @returns {Promise<TwoFactorToken | null>} Returns token object if found, otherwise returns null
 * @description
 * Queries the specified two-factor authentication token from the database.
 * Logs error and returns null on failure.
 */
export const getTwoFactorTokenByToken = async (
  token: string
): Promise<TwoFactorToken | null> => {
  try {
    return await db.twoFactorToken.findUnique({
      where: { token },
    });
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting two-factor authentication token by token:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * Get two-factor authentication token by user ID
 * @async
 * @function getTwoFactorTokenByUserId
 * @param {string} userId - User ID to query
 * @returns {Promise<TwoFactorToken | null>} Returns token object if found, otherwise returns null
 * @description
 * Queries the two-factor authentication token for the specified user from the database.
 * Uses findFirst because each user may have multiple tokens (although typically only one valid token).
 */
export const getTwoFactorTokenByUserId = async (
  userId: string
): Promise<TwoFactorToken | null> => {
  try {
    return await db.twoFactorToken.findFirst({
      where: {
        userId,
      },
    });
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting two-factor authentication token by user ID:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * Create new two-factor authentication token for user
 * @async
 * @function createTwoFactorToken
 * @param {string} userId - User ID to create token for
 * @returns {Promise<TwoFactorToken>} Returns created token object
 * @throws {Error} Throws when token creation fails
 * @description
 * Creates new two-factor authentication token:
 * 1. If user already has a token, delete old token first
 * 2. Generate new random token (6 digits)
 * 3. Set 5-minute expiration time
 * 4. Save to database and return
 */
export const createTwoFactorToken = async (
  userId: string
): Promise<TwoFactorToken> => {
  try {
    // Generate random token (6 digits)
    const token = generateToken();
    // Set 5-minute expiration time
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Check if token already exists
    const existingToken = await getTwoFactorTokenByUserId(userId);
    
    // If token exists, delete it first
    if (existingToken) {
      await db.twoFactorToken.delete({
        where: { id: existingToken.id },
      });
      logger.info("Deleted user's old two-factor authentication token", { userId });
    }

    // Create new token
    const newToken = await db.twoFactorToken.create({
      data: {
        token,
        expires,
        userId,
      },
    });

    logger.info("Created new two-factor authentication token", { userId });
    return newToken;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error creating two-factor authentication token:", {
      error: typedError.message,
      stack: typedError.stack,
      userId,
    });
    throw new Error("Failed to create two-factor authentication token");
  }
};

/**
 * Verify two-factor authentication token
 * @async
 * @function verifyTwoFactorToken
 * @param {string} userId - User ID
 * @param {string} token - Token value to verify
 * @returns {Promise<boolean>} Returns true if token is valid, otherwise returns false
 * @throws {Error} Throws when database operation fails
 * @description
 * Verifies two-factor authentication token:
 * 1. Check if token exists
 * 2. Check if token belongs to specified user
 * 3. Check if token has not expired
 * 4. Delete token after successful verification (one-time use)
 */
export const verifyTwoFactorToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    // Query token (must belong to specified user and not expired)
    const twoFactorToken = await db.twoFactorToken.findFirst({
      where: {
        token,
        userId,
        expires: { gt: new Date() }, // Ensure token has not expired
      },
    });

    // Token does not exist or has expired
    if (!twoFactorToken) {
      logger.warn("Two-factor authentication token verification failed", { userId, reason: "Token does not exist or has expired" });
      return false;
    }

    // Delete token after successful verification (one-time use)
    await db.twoFactorToken.delete({
      where: { id: twoFactorToken.id },
    });

    logger.info("Two-factor authentication token verification successful", { userId });
    return true;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error verifying two-factor authentication token:", {
      error: typedError.message,
      stack: typedError.stack,
      userId,
    });
    throw new Error("Failed to verify two-factor authentication token");
  }
};
