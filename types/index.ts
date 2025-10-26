// types/index.ts

import { User as PrismaUser, UserRole, UserStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { AuthStatus } from "./next-auth";

/**
 * Note: Session and User type extensions are defined in next-auth.d.ts
 * to avoid duplicate declarations
 */

/**
 * Type for database user
 * Extends Prisma User type with additional properties
 */
export type DatabaseUser = PrismaUser;

/**
 * Safe user type (without password and with serialized dates)
 */
export interface SafeUser extends Omit<DatabaseUser, "password" | "emailVerified"> {
  emailVerified: string | null;
}

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
 *
 * ⚠️ NOTE: User roles are stored in the UserRole join table, not as a scalar field.
 * Use getUserRolesAndPermissions() to fetch user's roles and permissions.
 */
export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  // ⚠️ REMOVED: role field - roles are now stored in UserRole join table
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
