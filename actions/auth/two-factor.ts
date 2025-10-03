/**
 * @fileoverview 雙因素認證相關的 Server Actions
 * @module actions/auth/two-factor
 * @description 處理雙因素認證令牌的生成、驗證和管理
 */

"use server";

import { db } from "@/lib/db";
import { TwoFactorToken } from "@prisma/client";
import { logger } from "@/lib/serverLogger";
import { generateToken } from "@/lib/crypto";

/**
 * 根據令牌值取得雙因素認證令牌
 * @async
 * @function getTwoFactorTokenByToken
 * @param {string} token - 要查詢的令牌值
 * @returns {Promise<TwoFactorToken | null>} 找到時返回令牌物件，否則返回 null
 * @description
 * 從資料庫中查詢指定的雙因素認證令牌。
 * 錯誤時記錄日誌並返回 null。
 */
export const getTwoFactorTokenByToken = async (
  token: string
): Promise<TwoFactorToken | null> => {
  try {
    return await db.twoFactorToken.findUnique({
      where: { token },
    });
  } catch (error) {
    const typedError = error as Error;
    logger.error("根據令牌取得雙因素認證令牌時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * 根據使用者 ID 取得雙因素認證令牌
 * @async
 * @function getTwoFactorTokenByUserId
 * @param {string} userId - 要查詢的使用者 ID
 * @returns {Promise<TwoFactorToken | null>} 找到時返回令牌物件，否則返回 null
 * @description
 * 從資料庫中查詢指定使用者的雙因素認證令牌。
 * 使用 findFirst 因為每個使用者可能有多個令牌（雖然通常只有一個有效令牌）。
 */
export const getTwoFactorTokenByUserId = async (
  userId: string
): Promise<TwoFactorToken | null> => {
  try {
    return await db.twoFactorToken.findFirst({
      where: {
        userId,
      },
    });
  } catch (error) {
    const typedError = error as Error;
    logger.error("根據使用者 ID 取得雙因素認證令牌時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * 為使用者建立新的雙因素認證令牌
 * @async
 * @function createTwoFactorToken
 * @param {string} userId - 要建立令牌的使用者 ID
 * @returns {Promise<TwoFactorToken>} 返回建立的令牌物件
 * @throws {Error} 當令牌建立失敗時拋出
 * @description
 * 建立新的雙因素認證令牌：
 * 1. 如果使用者已有令牌，先刪除舊令牌
 * 2. 生成新的隨機令牌（6 位數字）
 * 3. 設定 5 分鐘的有效期限
 * 4. 儲存到資料庫並返回
 */
export const createTwoFactorToken = async (
  userId: string
): Promise<TwoFactorToken> => {
  try {
    // 生成隨機令牌（6 位數字）
    const token = generateToken();
    // 設定 5 分鐘的有效期限
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // 檢查是否已有令牌
    const existingToken = await getTwoFactorTokenByUserId(userId);
    
    // 如果已有令牌，先刪除
    if (existingToken) {
      await db.twoFactorToken.delete({
        where: { id: existingToken.id },
      });
      logger.info("已刪除使用者的舊雙因素認證令牌", { userId });
    }

    // 建立新令牌
    const newToken = await db.twoFactorToken.create({
      data: {
        token,
        expires,
        userId,
      },
    });

    logger.info("已建立新的雙因素認證令牌", { userId });
    return newToken;
  } catch (error) {
    const typedError = error as Error;
    logger.error("建立雙因素認證令牌時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
      userId,
    });
    throw new Error("建立雙因素認證令牌失敗");
  }
};

/**
 * 驗證雙因素認證令牌
 * @async
 * @function verifyTwoFactorToken
 * @param {string} userId - 使用者 ID
 * @param {string} token - 要驗證的令牌值
 * @returns {Promise<boolean>} 令牌有效時返回 true，否則返回 false
 * @throws {Error} 當資料庫操作失敗時拋出
 * @description
 * 驗證雙因素認證令牌：
 * 1. 檢查令牌是否存在
 * 2. 檢查令牌是否屬於指定使用者
 * 3. 檢查令牌是否未過期
 * 4. 驗證成功後刪除令牌（一次性使用）
 */
export const verifyTwoFactorToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    // 查詢令牌（必須屬於指定使用者且未過期）
    const twoFactorToken = await db.twoFactorToken.findFirst({
      where: {
        token,
        userId,
        expires: { gt: new Date() }, // 確保令牌未過期
      },
    });

    // 令牌不存在或已過期
    if (!twoFactorToken) {
      logger.warn("雙因素認證令牌驗證失敗", { userId, reason: "令牌不存在或已過期" });
      return false;
    }

    // 驗證成功後刪除令牌（一次性使用）
    await db.twoFactorToken.delete({
      where: { id: twoFactorToken.id },
    });

    logger.info("雙因素認證令牌驗證成功", { userId });
    return true;
  } catch (error) {
    const typedError = error as Error;
    logger.error("驗證雙因素認證令牌時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
      userId,
    });
    throw new Error("驗證雙因素認證令牌失敗");
  }
};
