/**
 * @fileoverview User query related Server Actions
 * @module actions/user/queries
 * @description Provides user data query, update, delete operations with access control and React cache mechanism
 * @note Follows Next.js 15+ and React 19 best practices
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/serverLogger";
import { AuthorizationError } from "@/lib/errors/AppError";

/**
 * @typedef {Object} UserWithLoginMethods
 * @description User type including login methods
 */
type UserWithLoginMethods = Prisma.UserGetPayload<{
  include: { loginMethods: true };
}>;

/**
 * @interface AccessOptions
 * @description User data access option configuration
 * @property {boolean} [includeLoginMethods] - Whether to include login methods
 * @property {boolean} [includeSensitiveData] - Whether to include sensitive data (e.g. password)
 */
interface AccessOptions {
  includeLoginMethods?: boolean;
  includeSensitiveData?: boolean;
}

/**
 * @constant {AccessOptions}
 * @description Default access options
 */
const DEFAULT_OPTIONS: AccessOptions = {
  includeLoginMethods: false,
  includeSensitiveData: false,
};

/**
 * Validate if requesting user has permission to access target user's data
 * @param {Object} requestingUser - The user making the request
 * @param {string} requestingUser.id - Requesting user's ID
 * @param {string} requestingUser.role - Requesting user's role
 * @param {string} targetUserId - Target user's ID
 * @returns {boolean} - Returns true if access is allowed, otherwise returns false
 * @description
 * Admin and system users have full access. Regular users can only access their own data.
 */
const validateAccess = (
  requestingUser: { id: string; role: string },
  targetUserId: string
): boolean => {
  if (requestingUser.role === "admin" || requestingUser.role === "SYSTEM")
    return true;
  return requestingUser.id === targetUserId;
};

/**
 * Sanitize user data, remove sensitive fields
 * @param {UserWithLoginMethods} user - User object to sanitize
 * @param {boolean} includeSensitiveData - Whether to include sensitive data
 * @returns {Partial<UserWithLoginMethods>} - Sanitized user object
 * @description
 * Removes sensitive fields like password unless explicitly requested.
 * Even if not including sensitive data, password field is kept but set to undefined (for checking if password exists).
 */
const sanitizeUserData = (
  user: UserWithLoginMethods,
  includeSensitiveData: boolean
): Partial<UserWithLoginMethods> => {
  return {
    ...user,
    password: includeSensitiveData ? user.password : undefined,
  };
};

/**
 * @description User data caching strategy
 * @note Uses React cache() to cache data within a single request, compatible with Next.js 15+ serverless environment
 * React cache automatically handles request lifecycle, no manual cleanup needed
 */

/**
 * Internal function: Get user data by email address (without cache)
 * @private
 */
const _getUserByEmailInternal = async (
  email: string,
  requestingUser: { id: string; role: string },
  options: AccessOptions = DEFAULT_OPTIONS
): Promise<Partial<UserWithLoginMethods> | null> => {
  if (!db) {
    logger.error("Database connection not established (when querying user by email)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Querying user by email", {
      email,
      requestingUserId: requestingUser.id,
    });

    const user = await db.user.findUnique({
      where: { email },
      include: {
        loginMethods: options.includeLoginMethods || false,
      },
    });

    if (!user) {
      logger.info("User not found by email", { email });
      return null;
    }

    if (!validateAccess(requestingUser, user.id)) {
      logger.warn("Unauthorized attempt to access user data", {
        requestingUserId: requestingUser.id,
        targetUserId: user.id,
      });
      throw new AuthorizationError("Unauthorized access to user data");
    }

    const sanitizedUser = sanitizeUserData(
      user as UserWithLoginMethods,
      options.includeSensitiveData || false
    );
    logger.info("User found by email", { email, userId: user.id });
    return sanitizedUser;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting user by email:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    return null;
  }
};

/**
 * Get user data by email address (using React cache)
 * @async
 * @function getUserByEmail
 * @param {string} email - Email address to query
 * @param {Object} requestingUser - The user making the request
 * @param {string} requestingUser.id - Requesting user's ID
 * @param {string} requestingUser.role - Requesting user's role
 * @param {AccessOptions} [options=DEFAULT_OPTIONS] - Data inclusion options
 * @returns {Promise<Partial<UserWithLoginMethods>|null>} - Returns user object if found, otherwise returns null
 * @throws {AuthorizationError} Throws when unauthorized access is attempted
 * @throws {Error} Throws when database connection fails
 * @description
 * Uses React cache to cache data within a single request. Includes login methods and sensitive data based on options.
 * Validates access permissions before returning data. Compatible with Next.js 15+ serverless environment.
 */
export const getUserByEmail = cache(_getUserByEmailInternal);

/**
 * Internal function: Get user data by ID (without cache)
 * @private
 */
const _getUserByIdInternal = async (
  id: string,
  requestingUser: { id: string; role: string },
  options: AccessOptions = DEFAULT_OPTIONS
): Promise<Partial<UserWithLoginMethods> | null> => {
  if (!db) {
    logger.error("Database connection not established (when querying user by ID)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Querying user by ID", {
      id,
      requestingUserId: requestingUser.id,
    });

    const user = await db.user.findUnique({
      where: { id },
      include: {
        loginMethods: options.includeLoginMethods || false,
      },
    });

    if (!user) {
      logger.info("User not found by ID", { id });
      return null;
    }

    if (!validateAccess(requestingUser, user.id)) {
      logger.warn("Unauthorized attempt to access user data", {
        requestingUserId: requestingUser.id,
        targetUserId: user.id,
      });
      throw new AuthorizationError("Unauthorized access to user data");
    }

    const sanitizedUser = sanitizeUserData(
      user as UserWithLoginMethods,
      options.includeSensitiveData || false
    );
    logger.info("User found by ID", { id });
    return sanitizedUser;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error getting user by ID:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    return null;
  }
};

/**
 * Get user data by ID (using React cache)
 * @async
 * @function getUserById
 * @param {string} id - User ID to query
 * @param {Object} requestingUser - The user making the request
 * @param {string} requestingUser.id - Requesting user's ID
 * @param {string} requestingUser.role - Requesting user's role
 * @param {AccessOptions} [options=DEFAULT_OPTIONS] - Data inclusion options
 * @returns {Promise<Partial<UserWithLoginMethods>|null>} - Returns user object if found, otherwise returns null
 * @throws {AuthorizationError} Throws when unauthorized access is attempted
 * @throws {Error} Throws when database connection fails
 * @description
 * Uses React cache to cache data within a single request. Includes login methods and sensitive data based on options.
 * Validates access permissions before returning data. Compatible with Next.js 15+ serverless environment.
 */
export const getUserById = cache(_getUserByIdInternal);

/**
 * Update user information (with access control)
 * @async
 * @function updateUser
 * @param {string} id - User ID to update
 * @param {Object} requestingUser - The user making the request
 * @param {string} requestingUser.id - Requesting user's ID
 * @param {string} requestingUser.role - Requesting user's role
 * @param {Partial<Prisma.UserUpdateInput>} data - Data to update
 * @returns {Promise<Partial<UserWithLoginMethods>>} - Updated user object
 * @throws {AuthorizationError} Throws when unauthorized access is attempted
 * @throws {Error} Throws when database connection fails or update fails
 * @description
 * Updates user data after validating access permissions. Updates cache after successful update.
 * Only allows users to update their own data, unless they are admin or system users.
 */
export const updateUser = async (
  id: string,
  requestingUser: { id: string; role: string },
  data: Partial<Prisma.UserUpdateInput>
): Promise<Partial<UserWithLoginMethods>> => {
  if (!db) {
    logger.error("Database connection not established (when updating user)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Updating user", { id, requestingUserId: requestingUser.id });

    if (!validateAccess(requestingUser, id)) {
      logger.warn("Unauthorized attempt to update user data", {
        requestingUserId: requestingUser.id,
        targetUserId: id,
      });
      throw new AuthorizationError("Unauthorized update to user data");
    }

    const updatedUser = await db.user.update({
      where: { id },
      data,
      include: {
        loginMethods: true,
      },
    });

    const sanitizedUser = sanitizeUserData(updatedUser, false);
    logger.info("User updated successfully", { id });
    return sanitizedUser;
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error updating user:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    throw new Error("Failed to update user");
  }
};

/**
 * Delete user account (with access control)
 * @async
 * @function deleteUser
 * @param {string} id - User ID to delete
 * @param {Object} requestingUser - The user making the request
 * @param {string} requestingUser.id - Requesting user's ID
 * @param {string} requestingUser.role - Requesting user's role
 * @returns {Promise<void>}
 * @throws {AuthorizationError} Throws when unauthorized access is attempted
 * @throws {Error} Throws when database connection fails or deletion fails
 * @description
 * Permanently removes user account after validating access permissions.
 * Only allows users to delete their own account, unless they are admin or system users.
 * Removes user data from both database and cache.
 */
export const deleteUser = async (
  id: string,
  requestingUser: { id: string; role: string }
): Promise<void> => {
  if (!db) {
    logger.error("Database connection not established (when deleting user)");
    throw new Error("Database connection not established");
  }

  try {
    logger.info("Deleting user", { id, requestingUserId: requestingUser.id });

    if (!validateAccess(requestingUser, id)) {
      logger.warn("Unauthorized attempt to delete user", {
        requestingUserId: requestingUser.id,
        targetUserId: id,
      });
      throw new AuthorizationError("Unauthorized deletion of user");
    }

    await db.user.delete({
      where: { id },
    });

    logger.info("User deleted successfully", { id });
  } catch (error) {
    const typedError = error as Error;
    logger.error("Error deleting user:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    throw new Error("Failed to delete user");
  }
};
