/**
 * @fileoverview Database configuration using Prisma ORM
 * @module lib/db
 * @description Configures and exports a singleton Prisma client instance
 * following Next.js best practices for connection management.
 * Optimized for Vercel deployment and Edge Runtime compatibility.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create a new Prisma Client instance or reuse existing one
 * Singleton pattern prevents multiple instances in development
 */
const createPrismaClient = (): PrismaClient => {
  // Reuse existing client in development to prevent exhausting database connections
  if (process.env.NODE_ENV !== "production" && globalThis.prisma) {
    return globalThis.prisma;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Store in global for development hot-reload
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = client;
  }

  return client;
};

export const db = createPrismaClient();
