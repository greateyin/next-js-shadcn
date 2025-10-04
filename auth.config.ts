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
import { LoginSchema } from "@/schemas";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { User, UserStatus } from "@prisma/client";
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

export const authConfig: NextAuthConfig = {
  debug: false, // Disable debug mode for production
  adapter: PrismaAdapter(db) as any,
  providers: [
    // OAuth providers
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
    
    // Email/Password provider
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
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
          
          
          // Create simplified user object with type safety
          const safeUser: User = {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            emailVerified: user.emailVerified ?? null,
            image: user.image ?? null,
            role: user.role,
            status: user.status,
            password: null, // Don't pass the password back
            isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            loginAttempts: user.loginAttempts ?? 0,
            loginAttemptsResetAt: user.loginAttemptsResetAt ?? null,
            lastLoginAttempt: user.lastLoginAttempt ?? new Date(),
            lastSuccessfulLogin: user.lastSuccessfulLogin ?? new Date()
          };
          
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
     * Called when a user signs in via OAuth provider
     * Handles automatic account creation and role assignment for OAuth users
     */
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user has active status and default role
      if (account?.provider !== "credentials") {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
            include: { userRoles: true }
          });

          // If user was just created via OAuth (no roles assigned)
          if (existingUser && existingUser.userRoles.length === 0) {
            // Set user status to active (OAuth emails are pre-verified)
            await db.user.update({
              where: { id: existingUser.id },
              data: { 
                status: "active",
                emailVerified: new Date() // OAuth emails are verified
              }
            });

            // Assign default "user" role
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
          console.error("Error in OAuth signIn callback:", error);
          // Continue with sign in even if role assignment fails
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.status = user.status;
        token.email = user.email;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
        
        try {
          // Get user roles and permissions
          const userRolesAndPermissions = await getUserRolesAndPermissions(user.id);
          
          // Simplify token data to reduce size
          // Store only role names and permission names instead of full objects
          token.roleNames = userRolesAndPermissions.roles.map(r => r.name);
          token.permissionNames = userRolesAndPermissions.permissions.map(p => p.name);
          token.applicationPaths = userRolesAndPermissions.applications.map(a => a.path);
          
          // For backward compatibility
          token.role = userRolesAndPermissions.roles.some(r => r.name === 'admin') 
            ? 'admin' 
            : 'user';
            
        } catch (error) {
          console.error("Error getting user roles:", error);
          token.roleNames = [];
          token.permissionNames = [];
          token.applicationPaths = [];
          token.role = 'user'; // Default to user role
        }
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
        
        // For backward compatibility
        session.user.role = token.role as string;
        
        // Add simplified role data to session
        session.user.roleNames = token.roleNames || [];
        session.user.permissionNames = token.permissionNames || [];
        session.user.applicationPaths = token.applicationPaths || [];
        
        // For compatibility with existing code
        session.user.roles = session.user.roleNames.map(name => ({ name }));
        session.user.permissions = session.user.permissionNames.map(name => ({ name }));
        session.user.applications = session.user.applicationPaths.map(path => ({ path }));
        
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
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  trustHost: true, // Required for Next.js 15+ App Router
};
