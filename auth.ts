/**
 * @fileoverview Main authentication configuration
 * @module auth
 * @description Exports configured Auth.js instance with all authentication utilities
 */

import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

/**
 * Configured Auth.js instance for Next.js 15+ App Router
 * Provides authentication handlers, session management, and auth utilities
 */
export const { auth, signIn, signOut, handlers } = NextAuth(authConfig)
