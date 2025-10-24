/**
 * @fileoverview Main authentication configuration
 * @module auth
 * @description Exports configured Auth.js instance with all authentication utilities
 * This is the FULL auth instance with Prisma adapter - for Node.js runtime only
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Configured Auth.js instance for Next.js 15+ App Router
 * Provides authentication handlers, session management, and auth utilities
 * Includes Prisma adapter and full database functionality
 */
export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
