import { User } from "@prisma/client";

// Extend the base User type from Prisma
export type DatabaseUser = User & {
  // Add any additional fields you need
  emailVerified?: Date | null;
  image?: string | null;
};

// You might also want to add other auth-related types
export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type Session = {
  user: AuthUser;
  expires: string;
};
