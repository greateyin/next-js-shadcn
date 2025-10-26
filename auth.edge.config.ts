/**
 * Edge-compatible Auth.js configuration
 * @module auth.edge.config
 * @description Lightweight configuration for Edge Runtime (Middleware)
 * Does NOT include database adapter or any Node.js dependencies
 * 
 * CRITICAL: Uses shared base configuration to ensure JWT token compatibility
 */

import type { NextAuthConfig } from "next-auth"
import { baseAuthConfig } from "./auth.base.config"

/**
 * Edge-compatible Auth.js configuration
 * Extends baseAuthConfig with edge-specific callbacks
 * 
 * Key points:
 * - No Prisma adapter (Edge incompatible)
 * - No database operations
 * - JWT callback is read-only (preserves token data)
 * - All base settings (providers, cookies, session) inherited from baseAuthConfig
 */
export const edgeAuthConfig: NextAuthConfig = {
  ...baseAuthConfig,
  
  // ✅ Callbacks - Read-only in Edge config
  // The token is already populated by auth.config.ts during login
  // Edge config ONLY reads and passes through the data
  callbacks: {
    async jwt({ token, user, trigger }) {
      // ⚠️ CRITICAL FIX: Preserve all token data during any trigger
      // The token already contains roleNames, permissionNames, etc. from login
      // DO NOT reset or modify these fields

      // ⚠️ SECURITY: Do NOT log sensitive claims (email, roles, permissions, applications)
      // These are PII and authorization data that should never be exposed in shared logs
      // Use structured, redacted telemetry if debugging is required

      // Simply return token as-is
      // All RBAC data is already in the token from login
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.image = token.picture as string | null
        session.user.status = token.status as any
        // ⚠️ SECURITY: Do NOT include user.role - it doesn't exist in the database
        // Roles are stored in UserRole join table and returned in roleNames

        // ⚠️ Critical: Pass RBAC data to session
        session.user.roleNames = (token.roleNames as string[]) || []
        session.user.permissionNames = (token.permissionNames as string[]) || []
        session.user.applicationPaths = (token.applicationPaths as string[]) || []
      }
      return session
    },
  },
  
  // ⚠️ CRITICAL: Use same trust host setting
  trustHost: true,
}
