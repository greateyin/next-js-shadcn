/**
 * Edge-compatible Auth.js configuration
 * @module auth.edge.config
 * @description Lightweight configuration for Edge Runtime (Middleware)
 * Does NOT include database adapter or any Node.js dependencies
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
 */
export const edgeAuthConfig: NextAuthConfig = {
  debug: false,
  
  // ✅ Edge-compatible providers (minimal configuration)
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
      },
    },
  },
  
  // ✅ Callbacks - MUST NOT modify token in Edge config
  // The token is already populated by auth.config.ts during login
  // Edge config just reads and passes through the data
  callbacks: {
    async jwt({ token }) {
      // ⚠️ CRITICAL: Do NOT modify token here!
      // The token already contains all RBAC data from auth.config.ts
      // Any modifications here can cause data loss during token refresh
      
      // Debug logging to verify token data
      console.log('[Edge JWT Callback] Reading token:', {
        id: token.id,
        email: token.email,
        roleNames: token.roleNames,
        role: token.role,
        hasRoleNames: !!(token as any).roleNames
      })
      
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
}
