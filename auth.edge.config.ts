/**
 * Edge-compatible Auth.js configuration
 * @module auth.edge.config
 * @description Lightweight configuration for Edge Runtime (Middleware)
 * Does NOT include database adapter or any Node.js dependencies
 * 
 * CRITICAL: This config must be compatible with auth.config.ts to properly
 * read JWT tokens created during login.
 */

import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

/**
 * Edge-compatible Auth.js configuration
 * Used in middleware and other Edge environments
 * 
 * Key differences from full config:
 * - No Prisma adapter (Edge incompatible)
 * - No database operations
 * - Only JWT session strategy
 * - Minimal dependencies
 * - JWT callback MUST preserve all token data (no modifications)
 */
export const edgeAuthConfig: NextAuthConfig = {
  debug: false,
  
  // ✅ CRITICAL: Must match auth.config.ts providers exactly
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Must match
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Must match
    }),
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // ⚠️ Note: authorize function will be handled in full auth.config.ts
      async authorize() {
        // This is a placeholder - actual auth happens in full config
        return null
      }
    }),
  ],
  
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days - Must match
    updateAge: 24 * 60 * 60, // 24 hours - Must match
  },
  
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // ⚠️ CRITICAL: Must match auth.config.ts cookie domain
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 30 * 24 * 60 * 60, // Must match
      },
    },
  },
  
  // ✅ Callbacks - Read-only in Edge config
  // The token is already populated by auth.config.ts during login
  // Edge config ONLY reads and passes through the data
  callbacks: {
    async jwt({ token, user, trigger }) {
      // ⚠️ CRITICAL FIX: Preserve all token data during any trigger
      // The token already contains roleNames, permissionNames, etc. from login
      // DO NOT reset or modify these fields
      
      // Debug logging
      console.log('[Edge JWT Callback]', {
        trigger,
        hasUser: !!user,
        email: token?.email,
        roleNames: token?.roleNames,
        permissionNames: Array.isArray(token?.permissionNames) ? token.permissionNames.length : 0,
        applicationPaths: token?.applicationPaths
      })
      
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
        session.user.role = token.role as string

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
