import { User, UserRole, UserStatus } from "@prisma/client";

export type DatabaseUser = User;

export interface SafeUser extends Omit<DatabaseUser, "password" | "emailVerified"> {
  emailVerified: string | null;
}