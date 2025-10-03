import type { User as PrismaUser } from "@prisma/client";

/**
 * Database user type for internal use
 */
export type DatabaseUser = PrismaUser;

/**
 * Extended user type for authentication
 */
export interface AuthUser extends Omit<PrismaUser, "password"> {
  twoFactorConfirmation?: {
    id: string;
    userId: string;
    createdAt: Date;
  } | null;
}

declare module "next-auth" {
  interface User extends PrismaUser {}
  
  interface Session {
    user: AuthUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    role: PrismaUser["role"];
    status: PrismaUser["status"];
    picture?: string | null;
    twoFactorConfirmation?: {
      id: string;
      userId: string;
      createdAt: Date;
    } | null;
  }
}
