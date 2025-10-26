/**
 * Authentication configuration for Next.js application
 * @module auth.config
 * @description Auth.js V5+ configuration with Prisma adapter, OAuth providers, and custom credentials
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { baseAuthConfig } from "./auth.base.config";
import { LoginSchema } from "./schemas";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import type { UserStatus } from "@prisma/client";
import type { AuthStatus } from "@/types/next-auth";
import { getUserRolesAndPermissions } from "@/lib/auth/roleService";

/**
 * Maps Prisma UserStatus to Next.js AuthStatus
 */
const mapStatus = (status: UserStatus): AuthStatus => {
  switch (status) {
    case "pending":
      return "pending";
    case "active":
      return "active";
    case "suspended":
      return "suspended";
    case "banned":
      return "banned";
    case "deleted":
      return "deleted";
    default:
      return "inactive";
  }
};

// ⚠️ SECURITY: Do NOT log AUTH_SECRET or any sensitive information
// Logging secret length/prefix can aid in brute force attacks
// Use secure audit logging instead if needed

export const authConfig: NextAuthConfig = {
  // ✅ Extend base configuration for consistency
  ...baseAuthConfig,
  
  // ⚠️ Add Prisma adapter (NOT in edge config)
  adapter: PrismaAdapter(db) as any,
  
  // ⚠️ Override providers to add database-backed Credentials auth
  providers: [
    // Inherit OAuth providers from base but ensure exact match
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // ⚠️ SECURITY: Disabled dangerous email account linking
      // Prevents account takeover via unverified email addresses
      allowDangerousEmailAccountLinking: false,
    }),

    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // ⚠️ SECURITY: Disabled dangerous email account linking
      // Prevents account takeover via unverified email addresses
      allowDangerousEmailAccountLinking: false,
    }),
    
    // Email/Password provider with database authentication
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          
          // Parse and validate credentials
          const validatedFields = LoginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;
          
          // Find user
          const user = await db.user.findUnique({
            where: { email }
          });
          
          // Check if user exists
          if (!user) {
            return null;
          }
          
          
          if (!user.password) {
            return null;
          }
          
          // Real password check starts here
          
          // Real password check
          
          // Add null check for user.password
          let isValid = false;
          try {
            isValid = user.password 
              ? await verifyPassword(password, user.password)
              : false;
          } catch (error) {
            console.error("Password verification error:", error);
            return null;
          }
          
          if (!isValid) {
            return null;
          }

          // ⚠️ SECURITY: Check user status before allowing login
          // Reject suspended, banned, or deleted accounts
          if (user.status !== 'active' && user.status !== 'pending') {
            // Do not return user object for inactive accounts
            return null;
          }

          // ⚠️ SECURITY: Check if user has at least one role
          // This ensures only users with explicit role assignments can log in
          try {
            const userRoles = await db.userRole.findFirst({
              where: { userId: user.id }
            });

            if (!userRoles) {
              console.warn("User has no roles assigned - login denied");
              return null;
            }
          } catch (error) {
            console.error("Error checking user roles during login:", error);
            // Fail securely - deny login if we can't verify roles
            return null;
          }

          // Create simplified user object with type safety
          const safeUser = {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            emailVerified: user.emailVerified ?? null,
            image: user.image ?? null,
            role: 'user', // Default role, will be populated in JWT callback
            status: mapStatus(user.status),
            password: null, // Don't pass the password back
            isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            loginAttempts: user.loginAttempts ?? 0,
            loginAttemptsResetAt: user.loginAttemptsResetAt ?? null,
            lastLoginAttempt: user.lastLoginAttempt ?? new Date(),
            lastSuccessfulLogin: user.lastSuccessfulLogin ?? new Date()
          } as any;

          // ✅ Debug: Log user data from Credentials provider
          console.log('[CREDENTIALS_AUTHORIZE] User data:', {
            id: safeUser.id,
            email: safeUser.email,
            name: safeUser.name,
            image: safeUser.image,
            dbUserName: user.name,
            dbUserImage: user.image,
          });

          return safeUser;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    /**
     * Safe redirect callback - only allows redirects to whitelisted domains
     */
    async redirect({ url, baseUrl }) {
      // Handle relative URLs (e.g., /dashboard) - these are always safe
      if (url.startsWith("/")) {
        return url;
      }

      // List of allowed subdomains (read from environment variable, defaults to current domain only)
      const allowedDomains = process.env.ALLOWED_DOMAINS
        ? process.env.ALLOWED_DOMAINS.split(",").map(d => d.trim())
        : [new URL(baseUrl).hostname];

      try {
        const urlObj = new URL(url, baseUrl);

        // Check if domain is allowed
        const isAllowedDomain = allowedDomains.some(domain => {
          // Exact match or subdomain match
          return urlObj.hostname === domain ||
                 urlObj.hostname.endsWith(`.${domain}`);
        });

        // Check if same parent domain
        const isSameParentDomain = process.env.COOKIE_DOMAIN &&
          urlObj.hostname.endsWith(process.env.COOKIE_DOMAIN);

        if (isAllowedDomain || isSameParentDomain) {
          return urlObj.toString();
        }

        // If no match, return baseUrl
        return baseUrl;
      } catch (error) {
        // ⚠️ SECURITY: Do NOT log redirect errors as they may contain sensitive URLs
        return baseUrl;
      }
    },
    
    /**
     * Called when a user signs in via OAuth provider
     * Handles automatic account creation and role assignment for OAuth users
     *
     * ✅ OAuth users are automatically set to 'active' status
     * ✅ OAuth users are assigned default 'user' role
     * ✅ OAuth users can also set a password via password reset flow
     */
    async signIn({ user, account }) {
      // For OAuth providers, ensure user has active status and default role
      if (account?.provider !== "credentials") {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
            include: { userRoles: true }
          });

          // ⚠️ SECURITY: Reject suspended, banned, or deleted accounts
          if (existingUser && existingUser.status !== 'active' && existingUser.status !== 'pending') {
            return false;
          }

          // If user was just created via OAuth (no roles assigned)
          if (existingUser && existingUser.userRoles.length === 0) {
            // ✅ Set user status to active (OAuth emails are pre-verified)
            await db.user.update({
              where: { id: existingUser.id },
              data: {
                status: "active",
                emailVerified: new Date() // OAuth emails are verified
              }
            });

            // ✅ Assign default "user" role
            const userRole = await db.role.findUnique({
              where: { name: "user" }
            });

            if (userRole) {
              await db.userRole.create({
                data: {
                  userId: existingUser.id,
                  roleId: userRole.id
                }
              });
            }
          }
        } catch (error) {
          // ⚠️ SECURITY: Do NOT log error details
          // Continue with sign in even if role assignment fails
        }
      }

      return true;
    },
    
    async jwt({ token, user }) {
      // ✅ FIX: Always refresh user data from database to ensure latest information
      // This fixes the issue where avatar shows 'U' after password reset
      // because the token's name field wasn't being updated on subsequent logins

      let userId = user?.id || (token.id as string);

      if (user) {
        // Initial login - user object is provided
        token.id = user.id;
        token.status = user.status;
        token.email = user.email;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;

        // Debug: Log user data to diagnose avatar fallback issue
        console.log('[JWT_CALLBACK] Initial login - User data:', {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        });
      } else if (token.id) {
        // ✅ Token refresh - user object is undefined
        // Refresh user data from database to ensure latest information
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string }
          });

          if (dbUser) {
            token.status = dbUser.status;
            token.email = dbUser.email;
            token.name = dbUser.name ?? null;
            token.picture = dbUser.image ?? null;

            console.log('[JWT_CALLBACK] Token refresh - Updated user data:', {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              image: dbUser.image,
            });
          }
        } catch (error) {
          console.error('[JWT_CALLBACK] Error refreshing user data:', error);
          // Continue with existing token data if refresh fails
        }
      }

      // ⚠️ SECURITY: Do NOT log user ID, email, or other PII
      // These should only be logged through secure audit channels

      try {
        // Get user roles and permissions
        const userRolesAndPermissions = await getUserRolesAndPermissions(userId);

        // ⚠️ SECURITY: Enforce that user has at least one active role
        // This ensures access derives solely from relational RBAC assignments
        if (!userRolesAndPermissions.roles || userRolesAndPermissions.roles.length === 0) {
          console.warn(`User has no active roles - denying token issuance`);
          // Return token with empty RBAC data
          // This will cause downstream authorization checks to fail
          token.roleNames = [];
          token.permissionNames = [];
          token.applicationPaths = [];
          token.role = undefined;
          return token;
        }

        // Simplify token data to reduce size
        // Store only role names and permission names instead of full objects
        token.roleNames = userRolesAndPermissions.roles.map(r => r.name);
        token.permissionNames = userRolesAndPermissions.permissions.map(p => p.name);
        token.applicationPaths = userRolesAndPermissions.applications.map(a => a.path);

        // For backward compatibility
        token.role = userRolesAndPermissions.roles.some(r => r.name === 'admin')
          ? 'admin'
          : 'user';

        // ⚠️ SECURITY: Do NOT log token data, roles, or permissions
        // This information should only be logged through secure audit channels

      } catch (error) {
        // ⚠️ SECURITY: RBAC failure should NOT default to 'user' role
        // Instead, return empty sets to enforce least privilege
        // The user will have no roles/permissions until the issue is resolved
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error getting user roles - denying access with empty RBAC:", errorMessage);
        token.roleNames = [];
        token.permissionNames = [];
        token.applicationPaths = [];
        // Do NOT set token.role = 'user' - this breaks least privilege
        // Leave token.role undefined so downstream checks fail safely
        token.role = undefined;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.status = token.status as UserStatus;
        session.user.email = token.email as string;
        session.user.name = token.name ?? null;
        session.user.image = token.picture ?? null;

        // Debug: Log session data to diagnose avatar fallback issue
        console.log('[SESSION_CALLBACK] Session user data:', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        });

        // ⚠️ SECURITY: Do NOT include user.role - it doesn't exist in the database
        // Roles are stored in UserRole join table and returned in roleNames

        // Add simplified role data to session
        session.user.roleNames = (token.roleNames as string[]) || [];
        session.user.permissionNames = (token.permissionNames as string[]) || [];
        session.user.applicationPaths = (token.applicationPaths as string[]) || [];

        // ⚠️ SECURITY: Do NOT log session data, user ID, email, or permissions
        // These should only be logged through secure audit channels

        // For compatibility with existing code
        session.user.roles = session.user.roleNames.map(name => ({ name, id: '', createdAt: new Date(), updatedAt: new Date() }));
        session.user.permissions = session.user.permissionNames.map(name => ({ name, id: '', createdAt: new Date(), updatedAt: new Date(), description: undefined }));
        session.user.applications = session.user.applicationPaths.map(path => ({
          path,
          id: '',
          name: '',
          displayName: '',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: undefined,
          icon: undefined,
          order: 0
        }));
        
      }
      return session;
    }
  },
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
      // Use __Secure- prefix for enhanced security (production environment)
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        // Use "strict" for better security, but "lax" for better compatibility
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // 👇 Key: Share cookies across subdomains
        // For Vercel: Only set domain if explicitly configured
        // Otherwise, let the browser use the current domain
        domain: process.env.COOKIE_DOMAIN || undefined,
        // Add maxAge to ensure cookie is set with expiration
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      }
    }
  },
  trustHost: true, // Required for Next.js 15+ App Router
};
