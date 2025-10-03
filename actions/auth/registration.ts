/**
 * @fileoverview 使用者註冊相關的 Server Actions
 * @module actions/auth/registration
 * @description 處理使用者註冊、電子郵件驗證、密碼重置等認證流程
 */

"use server";

import * as z from "zod";
import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas/auth";
import { getUserByEmail } from "@/data/user";
import {
  generateVerificationToken,
  generatePasswordResetToken,
} from "@/lib/tokens";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/mail";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

/**
 * 使用者註冊 Action
 * @async
 * @function registerAction
 * @param {z.infer<typeof RegisterSchema>} values - 註冊表單資料
 * @returns {Promise<{error: string} | {success: string}>} 返回成功或錯誤訊息
 * @throws {Error} 當資料庫操作失敗時拋出
 * @description
 * 處理使用者註冊流程：
 * 1. 驗證輸入欄位
 * 2. 檢查電子郵件是否已被使用
 * 3. 創建新使用者帳號（密碼經過哈希處理）
 * 4. 生成並發送電子郵件驗證令牌
 */
export const registerAction = async (
  values: z.infer<typeof RegisterSchema>
) => {
  // 驗證表單欄位
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "欄位驗證失敗！" };
  }

  const { email, password, name } = validatedFields.data;
  
  // 對密碼進行哈希處理
  const hashedPassword = await hashPassword(password);

  // 檢查電子郵件是否已被使用
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "此電子郵件已被使用！" };
  }

  // 創建新使用者
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // 生成並發送驗證令牌
  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(email, verificationToken.token);

  return { success: "驗證郵件已發送！" };
};

/**
 * 重新發送驗證郵件 Action
 * @async
 * @function resendVerificationEmail
 * @param {string} email - 要重新發送驗證郵件的電子郵件地址
 * @returns {Promise<{error: string} | {success: string}>} 返回成功或錯誤訊息
 * @description
 * 重新生成並發送電子郵件驗證令牌給指定的電子郵件地址。
 * 僅當使用者存在時才會發送郵件。
 */
export const resendVerificationEmail = async (email: string) => {
  // 檢查使用者是否存在
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return { error: "找不到此電子郵件！" };
  }

  // 生成新的驗證令牌並發送郵件
  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(email, verificationToken.token);

  return { success: "驗證郵件已重新發送！" };
};
