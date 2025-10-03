import { db } from "@/lib/db";
import { generateToken } from "@/lib/crypto";
import type { Prisma } from "@prisma/client";

/**
 * Enable two-factor authentication for a user
 * @param userId - The user's ID
 * @returns The generated two-factor token
 */
export async function enableTwoFactor(userId: string) {
  return await db.$transaction(async (tx) => {
    // Enable 2FA
    await tx.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true }
    });

    // Generate and store token
    const token = generateToken();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await tx.twoFactorToken.create({
      data: {
        userId,
        token,
        expires,
      }
    });

    return token;
  });
}

/**
 * Verify a two-factor token
 * @param userId - The user's ID
 * @param token - The token to verify
 * @returns True if the token is valid, false otherwise
 */
export async function verifyTwoFactor(userId: string, token: string): Promise<boolean> {
  return await db.$transaction(async (tx) => {
    const twoFactorToken = await tx.twoFactorToken.findFirst({
      where: {
        token,
        userId,
        expires: { gt: new Date() },
        used: false,
      }
    });

    if (!twoFactorToken) {
      return false;
    }

    // Mark token as used
    await tx.twoFactorToken.update({
      where: { id: twoFactorToken.id },
      data: { used: true }
    });

    // Create confirmation
    await tx.twoFactorConfirmation.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    return true;
  });
}

/**
 * Disable two-factor authentication for a user
 * @param userId - The user's ID
 */
export async function disableTwoFactor(userId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    // Disable 2FA
    await tx.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false }
    });

    // Delete all tokens and confirmations
    await tx.twoFactorToken.deleteMany({
      where: { userId }
    });

    await tx.twoFactorConfirmation.deleteMany({
      where: { userId }
    });
  });
}