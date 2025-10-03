/**
 * @fileoverview 密碼重置相關的 Server Actions
 * @module actions/auth/password-reset
 * @description 處理密碼重置請求和新密碼設定
 */

"use server";

import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

/**
 * 發起密碼重置流程
 * @async
 * @function resetPassword
 * @param {string} email - 要重置密碼的使用者電子郵件地址
 * @returns {Promise<{error: string} | {success: string}>} 返回成功或錯誤訊息
 * @description
 * 處理密碼重置請求：
 * 1. 驗證使用者是否存在
 * 2. 生成密碼重置令牌
 * 3. 發送包含重置連結的郵件
 */
export const resetPassword = async (email: string) => {
  // 檢查使用者是否存在
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return { error: "找不到此電子郵件！" };
  }

  // 生成密碼重置令牌並發送郵件
  const passwordResetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(email, passwordResetToken.token);

  return { success: "重置郵件已發送！" };
};

/**
 * 使用重置令牌設定新密碼
 * @async
 * @function newPasswordAction
 * @param {string} token - 密碼重置令牌
 * @param {string} password - 新密碼
 * @returns {Promise<{error: string} | {success: string}>} 返回成功或錯誤訊息
 * @description
 * 處理新密碼設定：
 * 1. 驗證令牌是否有效且未過期
 * 2. 驗證使用者是否存在
 * 3. 更新使用者密碼（經過哈希處理）
 * 4. 刪除已使用的重置令牌
 */
export const newPasswordAction = async (token: string, password: string) => {
  // 驗證輸入
  if (!token || !password) {
    return { error: "缺少必要資料！" };
  }

  // 檢查令牌是否存在
  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return { error: "無效的令牌！" };
  }

  // 檢查令牌是否過期
  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "令牌已過期！" };
  }

  // 檢查使用者是否存在
  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "使用者不存在！" };
  }

  // 對新密碼進行哈希處理
  const hashedPassword = await hashPassword(password);

  // 更新使用者密碼
  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  // 刪除已使用的重置令牌
  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  });

  return { success: "密碼更新成功！" };
};
