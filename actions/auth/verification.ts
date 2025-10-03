/**
 * @fileoverview 電子郵件驗證令牌相關的 Server Actions
 * @module actions/auth/verification
 * @description 處理電子郵件驗證令牌的查詢和管理
 */

"use server";

import { db } from "@/lib/db";
import { logger } from "@/lib/serverLogger";
import { VerificationToken } from "@prisma/client";

/**
 * 根據令牌值取得驗證令牌
 * @async
 * @function getVerificationTokenByToken
 * @param {string} token - 要查詢的令牌值
 * @returns {Promise<VerificationToken|null>} 找到時返回令牌物件，否則返回 null
 * @throws {Error} 當資料庫連線未建立時拋出
 * @description
 * 從資料庫中查詢指定的電子郵件驗證令牌。
 * 記錄查詢過程和結果，錯誤時返回 null。
 */
export const getVerificationTokenByToken = async (
  token: string
): Promise<VerificationToken | null> => {
  if (!db) {
    logger.error("資料庫連線未建立（查詢令牌時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("查詢驗證令牌", { token });
    
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });
    
    logger.info("驗證令牌查詢結果", {
      token,
      found: !!verificationToken,
    });
    
    return verificationToken;
  } catch (error) {
    const typedError = error as Error;
    logger.error("根據令牌取得驗證令牌時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * 根據電子郵件地址取得驗證令牌
 * @async
 * @function getVerificationTokenByEmail
 * @param {string} email - 要查詢的電子郵件地址
 * @returns {Promise<VerificationToken|null>} 找到時返回令牌物件，否則返回 null
 * @throws {Error} 當資料庫連線未建立時拋出
 * @description
 * 從資料庫中查詢與指定電子郵件關聯的驗證令牌。
 * 使用 findFirst 因為可能存在多個令牌（雖然應該只保留最新的）。
 */
export const getVerificationTokenByEmail = async (
  email: string
): Promise<VerificationToken | null> => {
  if (!db) {
    logger.error("資料庫連線未建立（根據電子郵件查詢令牌時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("根據電子郵件查詢驗證令牌", { email });
    
    const verificationToken = await db.verificationToken.findFirst({
      where: { email },
    });
    
    logger.info("根據電子郵件查詢驗證令牌結果", {
      email,
      found: !!verificationToken,
    });
    
    return verificationToken;
  } catch (error) {
    const typedError = error as Error;
    logger.error("根據電子郵件取得驗證令牌時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return null;
  }
};

/**
 * 從令牌取得關聯的電子郵件地址
 * @async
 * @function getEmailFromToken
 * @param {string} token - 驗證令牌值
 * @returns {Promise<string|undefined>} 找到時返回電子郵件地址，否則返回 undefined
 * @throws {Error} 當資料庫連線未建立時拋出
 * @description
 * 從驗證令牌中提取關聯的電子郵件地址。
 * 僅選擇 email 欄位以優化查詢效能。
 */
export const getEmailFromToken = async (
  token: string
): Promise<string | undefined> => {
  if (!db) {
    logger.error("資料庫連線未建立（從令牌查詢電子郵件時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("從令牌查詢電子郵件", { token });
    
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
      select: { email: true }, // 僅選擇 email 欄位
    });
    
    logger.info("從令牌查詢電子郵件結果", {
      token,
      found: !!verificationToken,
    });
    
    return verificationToken?.email;
  } catch (error) {
    const typedError = error as Error;
    logger.error("從令牌取得電子郵件時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    return undefined;
  }
};
