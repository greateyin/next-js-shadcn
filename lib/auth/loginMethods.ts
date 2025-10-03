import { db } from "@/lib/db";

export async function addLoginMethod(userId: string, method: string) {
  return await db.loginMethod.create({
    data: {
      userId,
      method,
    },
  });
}

export async function getLoginMethods(userId: string) {
  return await db.loginMethod.findMany({
    where: { userId },
  });
}

export async function removeLoginMethod(userId: string, method: string) {
  // Prevent removing last login method
  const methods = await getLoginMethods(userId);
  if (methods.length <= 1) {
    throw new Error("Cannot remove last login method");
  }

  return await db.loginMethod.deleteMany({
    where: {
      userId,
      method,
    },
  });
}