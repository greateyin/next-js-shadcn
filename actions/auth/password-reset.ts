/**
 * @fileoverview 密碼重置相關的 Server Actions - Auth.js V5 Best Practices
 * @module actions/auth/password-reset
 * @description 處理密碼重置請求和新密碼設定，使用 Server Actions 模式
 */

"use server";

import * as z from "zod";
import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

/**
 * Email validation schema
 */
const EmailSchema = z.object({
  email: z.string().email({ message: "請輸入有效的電子郵件地址" }),
});

/**
 * New password validation schema with strength requirements
 */
const NewPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "密碼必須至少 8 個字元" })
    .regex(/[a-z]/, { message: "密碼必須包含至少一個小寫字母" })
    .regex(/[A-Z]/, { message: "密碼必須包含至少一個大寫字母" })
    .regex(/[0-9]/, { message: "密碼必須包含至少一個數字" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});

/**
 * 發起密碼重置流程 - Server Action
 * @async
 * @function requestPasswordResetAction
 * @param {any} prevState - 前一個狀態（由 useActionState 提供）
 * @param {FormData} formData - 包含 email 的表單數據
 * @returns {Promise<{error: string} | {success: string}>} 返回成功或錯誤訊息
 * @description
 * 處理密碼重置請求：
 * 1. 驗證表單數據
 * 2. 驗證使用者是否存在
 * 3. 生成密碼重置令牌
 * 4. 發送包含重置連結的郵件
 * 
 * @example
 * ```tsx
 * // 使用 useActionState
 * const [state, formAction] = useActionState(requestPasswordResetAction, undefined);
 * <form action={formAction}>
 *   <input name="email" type="email" required />
 *   <button type="submit">發送重置連結</button>
 * </form>
 * ```
 */
export const requestPasswordResetAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  try {
    // 從 FormData 提取 email
    const email = formData.get("email") as string;

    // 驗證 email 格式
    const validatedFields = EmailSchema.safeParse({ email });

    if (!validatedFields.success) {
      return { error: "請輸入有效的電子郵件地址" };
    }

    // 檢查使用者是否存在
    const existingUser = await getUserByEmail(validatedFields.data.email);

    if (!existingUser) {
      // 安全考量：即使用戶不存在也返回成功訊息，避免洩露用戶存在性
      return { success: "如果該電子郵件存在，重置連結已發送！" };
    }

    // 檢查用戶是否使用密碼登入（OAuth 用戶沒有密碼）
    if (!existingUser.password) {
      return {
        error: "此帳號使用社交登入，無法重置密碼。請使用 Google 或 GitHub 登入。"
      };
    }

    // 生成密碼重置令牌並發送郵件
    const passwordResetToken = await generatePasswordResetToken(
      validatedFields.data.email
    );
    await sendPasswordResetEmail(
      validatedFields.data.email,
      passwordResetToken.token
    );

    return { success: "重置郵件已發送！請檢查您的信箱。" };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "發送重置郵件時發生錯誤，請稍後再試。" };
  }
};

/**
 * 舊版本的 resetPassword - 保留以向後兼容
 * @deprecated 請使用 requestPasswordResetAction
 */
export const resetPassword = async (email: string) => {
  const formData = new FormData();
  formData.append("email", email);
  return requestPasswordResetAction(undefined, formData);
};

/**
 * 使用重置令牌設定新密碼 - Server Action
 * @async
 * @function resetPasswordWithTokenAction
 * @param {any} prevState - 前一個狀態（由 useActionState 提供）
 * @param {FormData} formData - 包含 token, password, confirmPassword 的表單數據
 * @returns {Promise<{error: string} | {success: string}>} 返回成功或錯誤訊息
 * @description
 * 處理新密碼設定：
 * 1. 驗證表單數據和密碼強度
 * 2. 驗證令牌是否有效且未過期
 * 3. 驗證使用者是否存在
 * 4. 更新使用者密碼（經過哈希處理）
 * 5. 刪除已使用的重置令牌
 * 6. 清除所有現有 session（強制重新登入）
 * 
 * @example
 * ```tsx
 * // 使用 useActionState
 * const [state, formAction] = useActionState(resetPasswordWithTokenAction, undefined);
 * <form action={formAction}>
 *   <input type="hidden" name="token" value={token} />
 *   <input name="password" type="password" required />
 *   <input name="confirmPassword" type="password" required />
 *   <button type="submit">重置密碼</button>
 * </form>
 * ```
 */
export const resetPasswordWithTokenAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  try {
    // 從 FormData 提取數據
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // 驗證輸入
    if (!token) {
      return { error: "缺少重置令牌！" };
    }

    // 驗證密碼格式和強度
    const validatedFields = NewPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validatedFields.success) {
      const errors = validatedFields.error.errors.map((err) => err.message);
      return { error: errors[0] }; // 返回第一個錯誤訊息
    }

    // 檢查令牌是否存在
    const existingToken = await getPasswordResetTokenByToken(token);

    if (!existingToken) {
      return { error: "無效的重置令牌！" };
    }

    // 檢查令牌是否過期
    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      // 刪除過期令牌
      await db.passwordResetToken.delete({
        where: { id: existingToken.id },
      });
      return { error: "重置令牌已過期！請重新申請密碼重置。" };
    }

    // 檢查使用者是否存在
    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
      return { error: "使用者不存在！" };
    }

    // 對新密碼進行哈希處理
    const hashedPassword = await hashPassword(validatedFields.data.password);

    // 更新使用者密碼
    await db.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });

    // 刪除已使用的重置令牌
    await db.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    // 清除該用戶的所有 session（強制重新登入以確保安全）
    await db.session.deleteMany({
      where: { userId: existingUser.id },
    });

    return {
      success: "密碼重置成功！請使用新密碼登入。"
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "重置密碼時發生錯誤，請稍後再試。" };
  }
};

/**
 * 舊版本的 newPasswordAction - 保留以向後兼容
 * @deprecated 請使用 resetPasswordWithTokenAction
 */
export const newPasswordAction = async (token: string, password: string) => {
  const formData = new FormData();
  formData.append("token", token);
  formData.append("password", password);
  formData.append("confirmPassword", password);
  return resetPasswordWithTokenAction(undefined, formData);
};
