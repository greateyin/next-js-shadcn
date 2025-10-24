/**
 * Edge-compatible authentication configuration
 * @module auth.config.edge
 * @description Auth.js configuration for Edge Runtime (middleware)
 * This file contains ONLY edge-compatible code - no Prisma, no database calls
 */

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

/**
 * Edge-compatible auth configuration
 * Used by middleware.ts for session verification
 * Does NOT include database adapter or credentials provider
 */
export const authConfigEdge = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // JWT is required for Edge Runtime
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      // Basic auth check for middleware
      return !!auth;
    },
  },
} satisfies NextAuthConfig;
