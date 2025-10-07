/**
 * @fileoverview Email verification token related Server Actions
 * @module actions/auth/verification
 * @description Handles querying and management of email verification tokens
 */

"use server";

import { db } from "@/lib/db";
import { logger } from "@/lib/serverLogger";
import { VerificationToken } from "@prisma/client";

/**
 * Get verification token by token value
 * @async
 * @function getVerificationTokenByToken
 * @param {string} token - Token value to query
 * @returns {Promise<VerificationToken|null>} Returns token object if found, otherwise returns null
 * @throws {Error} Throws when database connection is not established
 * @description
 * Queries the specified email verification token from the database.
 * Logs query process and results, returns null on error.
 */
export const getVerificationTokenByToken = async (
  token: string
): Promise<VerificationToken | null> => {
  if (!db) {
    logger.error("Database connection not established (when querying token)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Querying verification token", { token });
    
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });
    
    logger.info("Verification token query result", {
      token,
      found: !!verificationToken,
    });
    
    return verificationToken;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting verification token by token:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * Get verification token by email address
 * @async
 * @function getVerificationTokenByEmail
 * @param {string} email - Email address to query
 * @returns {Promise<VerificationToken|null>} Returns token object if found, otherwise returns null
 * @throws {Error} Throws when database connection is not established
 * @description
 * Queries the verification token associated with the specified email from the database.
 * Uses findFirst because multiple tokens may exist (although only the latest should be kept).
 */
export const getVerificationTokenByEmail = async (
  email: string
): Promise<VerificationToken | null> => {
  if (!db) {
    logger.error("Database connection not established (when querying token by email)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Querying verification token by email", { email });
    
    const verificationToken = await db.verificationToken.findFirst({
      where: { email },
    });
    
    logger.info("Verification token query result by email", {
      email,
      found: !!verificationToken,
    });
    
    return verificationToken;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting verification token by email:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * Get associated email address from token
 * @async
 * @function getEmailFromToken
 * @param {string} token - Verification token value
 * @returns {Promise<string|undefined>} Returns email address if found, otherwise returns undefined
 * @throws {Error} Throws when database connection is not established
 * @description
 * Extracts the associated email address from the verification token.
 * Only selects the email field to optimize query performance.
 */
export const getEmailFromToken = async (
  token: string
): Promise<string | undefined> => {
  if (!db) {
    logger.error("Database connection not established (when querying email from token)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Querying email from token", { token });
    
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
      select: { email: true }, // Only select email field
    });
    
    logger.info("Email query result from token", {
      token,
      found: !!verificationToken,
    });
    
    return verificationToken?.email;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting email from token:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return undefined;
  }
};
