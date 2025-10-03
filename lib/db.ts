/**
 * @fileoverview Database configuration using Prisma ORM
 * @module lib/db
 * @description Configures and exports a singleton Prisma client instance
 * following Next.js best practices for connection management
 */

import { PrismaClient } from "@prisma/client";

/**
 * Global type declaration for PrismaClient
 * @global
 * @description Extends the global namespace to include prisma client type
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient instance
 * @constant
 * @type {PrismaClient}
 * @description PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * @see {@link https://pris.ly/d/help/next-js-best-practices|Prisma Best Practices}
 * 
 * @example
 * ```ts
 * // Using the db client
 * const user = await db.user.findUnique({
 *   where: { email: 'user@example.com' }
 * });
 * ```
 */
export const db = globalThis.prisma || new PrismaClient();

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
