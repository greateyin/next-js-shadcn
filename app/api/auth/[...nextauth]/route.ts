/**
 * @fileoverview Auth.js V5+ route handler for Next.js 15+ App Router
 * @module app/api/auth/[...nextauth]
 * @description Centralized authentication endpoint handling:
 * - Sign in/out operations
 * - Session management
 * - OAuth provider callbacks
 * - JWT token operations
 * - CSRF protection
 */

import { handlers } from "@/auth";

/**
 * GET handler for Auth.js
 * Handles session validation and OAuth provider callbacks
 */
export const { GET, POST } = handlers;
