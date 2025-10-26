/**
 * @fileoverview Auth.js V5+ route handler for Next.js 15+ App Router
 * @module app/api/auth/[...nextauth]
 * @description Centralized authentication endpoint handling:
 * - Sign in/out operations
 * - Session management
 * - OAuth provider callbacks
 * - JWT token operations
 * - CSRF protection
 *
 * ✅ Auth.js V5 Best Practice:
 * - handlers includes ALL auth endpoints: /api/auth/signin, /api/auth/signout, /api/auth/session, etc.
 * - Do NOT create custom /api/auth/session/route.ts
 * - Let handlers manage all session operations
 */

import { handlers } from "@/auth";

/**
 * GET and POST handlers for Auth.js
 * Handles all authentication operations including:
 * - Session validation and retrieval
 * - OAuth provider callbacks
 * - Sign in/out operations
 * - CSRF protection
 */
export const { GET, POST } = handlers;
