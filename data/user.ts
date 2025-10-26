import { db } from "@/lib/db";
import { User, UserRole, UserStatus } from "@prisma/client";

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<User> => {
  const user = await db.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name || null,
      // ⚠️ SECURITY: User status defaults to 'pending' - requires email verification
      // Roles are assigned via UserRole join table, not as a scalar field
      status: "pending" as UserStatus,
    }
  });

  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    return await db.user.findUnique({
      where: { email }
    });
  } catch {
    return null;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    return await db.user.findUnique({
      where: { id }
    });
  } catch {
    return null;
  }
};
