// types/index.ts

import { User as PrismaUser, UserRole, UserStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { AuthStatus } from "./next-auth";

/**
 * Extended session user interface
 * Adds custom properties to the default NextAuth session user
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      status: AuthStatus;
      image?: string | null;
    }
  }

  interface User extends PrismaUser {}
}

/**
 * Type for database user
 * Extends Prisma User type with additional properties
 */
export type DatabaseUser = PrismaUser;

/**
 * User with all relations type
 */
export type UserWithRelations = PrismaUser & {
  accounts?: Account[];
  sessions?: DbSession[];
  twoFactorConfirmation?: TwoFactorConfirmation | null;
};

/**
 * Base User type
 */
export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: UserStatus;
}

/**
 * User without password type
 */
export type UserWithoutPassword = Omit<User, "password">;

/**
 * Login credentials type
 */
export interface LoginCredentials {
  email: string;
  password: string;
  code?: string;
}

/**
 * Create user input type
 */
export interface CreateUserInput {
  name: string | null;
  email: string;
  password: string;
}

/**
 * Account type
 */
export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  user: User;
}

/**
 * Database Session type
 */
export interface DbSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  lastActivity: Date;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  deviceId: string | null;
  sessionType: string;
  user: User;
}

/**
 * Two factor confirmation type
 */
export interface TwoFactorConfirmation {
  id: string;
  userId: string;
  createdAt: Date;
  user: User;
}

/**
 * Two factor token type
 */
export interface TwoFactorToken {
  id: string;
  userId: string;
  token: string;
  expires: Date;
  used: boolean;
  createdAt: Date;
  user: User;
}

/**
 * Password reset token type
 */
export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expires: Date;
  userId: string;
  createdAt: Date;
  user: User;
}

/**
 * Verification token type
 */
export interface VerificationToken {
  id: string;
  email: string;
  token: string;
  expires: Date;
}

/**
 * Login method type
 */
export interface LoginMethod {
  id: string;
  userId: string;
  method: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

/**
 * Audit log type
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  status: string;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  targetUserId: string | null;
  resourceId: string | null;
  resourceType: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  metadata: any | null;
  priority: string;
  sessionId: string | null;
  user: User | null;
}

/**
 * Action result type
 */
export interface ActionResult<T = any> {
  error?: string;
  success?: string;
  data?: T;
}
