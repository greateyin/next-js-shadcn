import { prisma } from "@/lib/prisma"
import type { DatabaseUser } from "@/types/auth"

/**
 * Get a user by their email address
 */
export async function getUserByEmail(email: string): Promise<DatabaseUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as DatabaseUser;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

/**
 * Get a user by their ID
 */
export async function getUserById(id: string): Promise<DatabaseUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as DatabaseUser;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}
