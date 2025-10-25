/**
 * Base Authentication Configuration
 * @module auth.base.config
 * @description Shared configuration for both main auth and edge auth instances
 * This ensures JWT tokens are compatible across instances
 */

import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

/**
 * Base configuration shared between auth.config.ts and auth.edge.config.ts
 * 
 * CRITICAL: This must be the SINGLE source of truth for:
 * - Providers configuration
 * - Session strategy
 * - Cookie settings
 * - Pages
 * - Trust host
 * 
 * Any changes here will affect BOTH instances
 */
export const baseAuthConfig = {
  debug: false,
  
  // ✅ Providers - MUST be identical in both instances
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // Note: actual authorize logic is in auth.config.ts
      async authorize() {
        return null
      }
    }),
  ],
  
  // ✅ Pages - MUST be identical
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  
  // ✅ Session - MUST be identical
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // ✅ Cookies - MUST be identical
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  
  // ✅ Trust host - MUST be identical
  trustHost: true,
  
} satisfies Partial<NextAuthConfig>
