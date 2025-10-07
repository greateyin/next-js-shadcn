import { db } from "@/lib/db";
import { TwoFactorToken } from "@prisma/client";

/**
 * Get a two-factor token by token value
 * @param token - The token value to look up
 * @returns The token if found, null otherwise
 */
export const getTwoFactorTokenByToken = async (token: string): Promise<TwoFactorToken | null> => {
  try {
    const twoFactorToken = await db.twoFactorToken.findUnique({
      where: { token }
    });

    return twoFactorToken;
  } catch (error) {
    console.error("[GET_TWO_FACTOR_TOKEN_BY_TOKEN]", error);
    return null;
  }
};

/**
 * Get a two-factor token by user ID
 * @param userId - The user ID to look up
 * @returns The token if found, null otherwise
 */
export const getTwoFactorTokenByUserId = async (userId: string): Promise<TwoFactorToken | null> => {
  try {
    const twoFactorToken = await db.twoFactorToken.findFirst({
      where: { userId }
    });

    return twoFactorToken;
  } catch (error) {
    console.error("[GET_TWO_FACTOR_TOKEN_BY_USER_ID]", error);
    return null;
  }
};

/**
 * Create a new two-factor token
 * @param userId - The user ID to create the token for
 * @returns The created token
 */
export const createTwoFactorToken = async (userId: string): Promise<TwoFactorToken> => {
  try {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const existingToken = await getTwoFactorTokenByUserId(userId);
    if (existingToken) {
      await db.twoFactorToken.delete({
        where: { id: existingToken.id }
      });
    }

    return await db.twoFactorToken.create({
      data: {
        userId,
        token,
        expires,
      }
    });
  } catch (error) {
    console.error("[CREATE_TWO_FACTOR_TOKEN]", error);
    throw new Error("Failed to create two-factor token");
  }
};

/**
 * Delete a two-factor token
 * @param id - The token ID to delete
 */
export const deleteTwoFactorToken = async (id: string): Promise<void> => {
  try {
    await db.twoFactorToken.delete({
      where: { id }
    });
  } catch (error) {
    console.error("[DELETE_TWO_FACTOR_TOKEN]", error);
    throw new Error("Failed to delete two-factor token");
  }
};