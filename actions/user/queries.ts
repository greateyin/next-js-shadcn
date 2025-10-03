/**
 * @fileoverview 使用者查詢相關的 Server Actions
 * @module actions/user/queries
 * @description 提供使用者資料查詢、更新、刪除等操作，包含存取控制和 React cache 機制
 * @note 符合 Next.js 15+ 和 React 19 最佳實踐
 */

"use server";

import { cache } from "react";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/serverLogger";
import { AuthorizationError } from "@/lib/errors/AppError";

/**
 * @typedef {Object} UserWithLoginMethods
 * @description 包含登入方法的使用者類型
 */
type UserWithLoginMethods = Prisma.UserGetPayload<{
  include: { loginMethods: true };
}>;

/**
 * @interface AccessOptions
 * @description 使用者資料存取選項配置
 * @property {boolean} [includeLoginMethods] - 是否包含登入方法
 * @property {boolean} [includeSensitiveData] - 是否包含敏感資料（如密碼）
 */
interface AccessOptions {
  includeLoginMethods?: boolean;
  includeSensitiveData?: boolean;
}

/**
 * @constant {AccessOptions}
 * @description 預設的存取選項
 */
const DEFAULT_OPTIONS: AccessOptions = {
  includeLoginMethods: false,
  includeSensitiveData: false,
};

/**
 * 驗證請求使用者是否有權存取目標使用者的資料
 * @param {Object} requestingUser - 發出請求的使用者
 * @param {string} requestingUser.id - 請求使用者的 ID
 * @param {string} requestingUser.role - 請求使用者的角色
 * @param {string} targetUserId - 目標使用者的 ID
 * @returns {boolean} - 如果允許存取則返回 true，否則返回 false
 * @description
 * 管理員和系統使用者擁有完全存取權限。一般使用者只能存取自己的資料。
 */
const validateAccess = (
  requestingUser: { id: string; role: string },
  targetUserId: string
): boolean => {
  if (requestingUser.role === "admin" || requestingUser.role === "SYSTEM")
    return true;
  return requestingUser.id === targetUserId;
};

/**
 * 清理使用者資料，移除敏感欄位
 * @param {UserWithLoginMethods} user - 要清理的使用者物件
 * @param {boolean} includeSensitiveData - 是否包含敏感資料
 * @returns {Partial<UserWithLoginMethods>} - 清理後的使用者物件
 * @description
 * 除非明確要求，否則移除密碼等敏感欄位。
 * 即使不包含敏感資料，也保留密碼欄位但設為 undefined（用於檢查密碼是否存在）。
 */
const sanitizeUserData = (
  user: UserWithLoginMethods,
  includeSensitiveData: boolean
): Partial<UserWithLoginMethods> => {
  return {
    ...user,
    password: includeSensitiveData ? user.password : undefined,
  };
};

/**
 * @description 使用者資料快取策略
 * @note 使用 React cache() 在單次請求內緩存數據，符合 Next.js 15+ serverless 環境
 * React cache 自動處理請求生命週期，無需手動清理
 */

/**
 * 內部函數：根據電子郵件地址取得使用者資料（不含快取）
 * @private
 */
const _getUserByEmailInternal = async (
  email: string,
  requestingUser: { id: string; role: string },
  options: AccessOptions = DEFAULT_OPTIONS
): Promise<Partial<UserWithLoginMethods> | null> => {
  if (!db) {
    logger.error("資料庫連線未建立（根據電子郵件查詢使用者時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("根據電子郵件查詢使用者", {
      email,
      requestingUserId: requestingUser.id,
    });

    const user = await db.user.findUnique({
      where: { email },
      include: {
        loginMethods: options.includeLoginMethods || false,
      },
    });

    if (!user) {
      logger.info("根據電子郵件未找到使用者", { email });
      return null;
    }

    if (!validateAccess(requestingUser, user.id)) {
      logger.warn("未授權存取使用者資料的嘗試", {
        requestingUserId: requestingUser.id,
        targetUserId: user.id,
      });
      throw new AuthorizationError("未授權存取使用者資料");
    }

    const sanitizedUser = sanitizeUserData(
      user as UserWithLoginMethods,
      options.includeSensitiveData || false
    );
    logger.info("根據電子郵件找到使用者", { email, userId: user.id });
    return sanitizedUser;
  } catch (error) {
    const typedError = error as Error;
    logger.error("根據電子郵件取得使用者時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    return null;
  }
};

/**
 * 根據電子郵件地址取得使用者資料（使用 React cache）
 * @async
 * @function getUserByEmail
 * @param {string} email - 要查詢的電子郵件地址
 * @param {Object} requestingUser - 發出請求的使用者
 * @param {string} requestingUser.id - 請求使用者的 ID
 * @param {string} requestingUser.role - 請求使用者的角色
 * @param {AccessOptions} [options=DEFAULT_OPTIONS] - 資料包含選項
 * @returns {Promise<Partial<UserWithLoginMethods>|null>} - 找到時返回使用者物件，否則返回 null
 * @throws {AuthorizationError} 當嘗試未授權存取時拋出
 * @throws {Error} 當資料庫連線失敗時拋出
 * @description
 * 使用 React cache 在單次請求內緩存資料。根據選項包含登入方法和敏感資料。
 * 在返回資料前驗證存取權限。符合 Next.js 15+ serverless 環境。
 */
export const getUserByEmail = cache(_getUserByEmailInternal);

/**
 * 內部函數：根據 ID 取得使用者資料（不含快取）
 * @private
 */
const _getUserByIdInternal = async (
  id: string,
  requestingUser: { id: string; role: string },
  options: AccessOptions = DEFAULT_OPTIONS
): Promise<Partial<UserWithLoginMethods> | null> => {
  if (!db) {
    logger.error("資料庫連線未建立（根據 ID 查詢使用者時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("根據 ID 查詢使用者", {
      id,
      requestingUserId: requestingUser.id,
    });

    const user = await db.user.findUnique({
      where: { id },
      include: {
        loginMethods: options.includeLoginMethods || false,
      },
    });

    if (!user) {
      logger.info("根據 ID 未找到使用者", { id });
      return null;
    }

    if (!validateAccess(requestingUser, user.id)) {
      logger.warn("未授權存取使用者資料的嘗試", {
        requestingUserId: requestingUser.id,
        targetUserId: user.id,
      });
      throw new AuthorizationError("未授權存取使用者資料");
    }

    const sanitizedUser = sanitizeUserData(
      user as UserWithLoginMethods,
      options.includeSensitiveData || false
    );
    logger.info("根據 ID 找到使用者", { id });
    return sanitizedUser;
  } catch (error) {
    const typedError = error as Error;
    logger.error("根據 ID 取得使用者時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    return null;
  }
};

/**
 * 根據 ID 取得使用者資料（使用 React cache）
 * @async
 * @function getUserById
 * @param {string} id - 要查詢的使用者 ID
 * @param {Object} requestingUser - 發出請求的使用者
 * @param {string} requestingUser.id - 請求使用者的 ID
 * @param {string} requestingUser.role - 請求使用者的角色
 * @param {AccessOptions} [options=DEFAULT_OPTIONS] - 資料包含選項
 * @returns {Promise<Partial<UserWithLoginMethods>|null>} - 找到時返回使用者物件，否則返回 null
 * @throws {AuthorizationError} 當嘗試未授權存取時拋出
 * @throws {Error} 當資料庫連線失敗時拋出
 * @description
 * 使用 React cache 在單次請求內緩存資料。根據選項包含登入方法和敏感資料。
 * 在返回資料前驗證存取權限。符合 Next.js 15+ serverless 環境。
 */
export const getUserById = cache(_getUserByIdInternal);

/**
 * 更新使用者資訊（含存取控制）
 * @async
 * @function updateUser
 * @param {string} id - 要更新的使用者 ID
 * @param {Object} requestingUser - 發出請求的使用者
 * @param {string} requestingUser.id - 請求使用者的 ID
 * @param {string} requestingUser.role - 請求使用者的角色
 * @param {Partial<Prisma.UserUpdateInput>} data - 要更新的資料
 * @returns {Promise<Partial<UserWithLoginMethods>>} - 更新後的使用者物件
 * @throws {AuthorizationError} 當嘗試未授權存取時拋出
 * @throws {Error} 當資料庫連線失敗或更新失敗時拋出
 * @description
 * 驗證存取權限後更新使用者資料。成功更新後更新快取。
 * 僅允許使用者更新自己的資料，除非是管理員或系統使用者。
 */
export const updateUser = async (
  id: string,
  requestingUser: { id: string; role: string },
  data: Partial<Prisma.UserUpdateInput>
): Promise<Partial<UserWithLoginMethods>> => {
  if (!db) {
    logger.error("資料庫連線未建立（更新使用者時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("更新使用者", { id, requestingUserId: requestingUser.id });

    if (!validateAccess(requestingUser, id)) {
      logger.warn("未授權更新使用者資料的嘗試", {
        requestingUserId: requestingUser.id,
        targetUserId: id,
      });
      throw new AuthorizationError("未授權更新使用者資料");
    }

    const updatedUser = await db.user.update({
      where: { id },
      data,
      include: {
        loginMethods: true,
      },
    });

    const sanitizedUser = sanitizeUserData(updatedUser, false);
    logger.info("使用者更新成功", { id });
    return sanitizedUser;
  } catch (error) {
    const typedError = error as Error;
    logger.error("更新使用者時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    throw new Error("更新使用者失敗");
  }
};

/**
 * 刪除使用者帳號（含存取控制）
 * @async
 * @function deleteUser
 * @param {string} id - 要刪除的使用者 ID
 * @param {Object} requestingUser - 發出請求的使用者
 * @param {string} requestingUser.id - 請求使用者的 ID
 * @param {string} requestingUser.role - 請求使用者的角色
 * @returns {Promise<void>}
 * @throws {AuthorizationError} 當嘗試未授權存取時拋出
 * @throws {Error} 當資料庫連線失敗或刪除失敗時拋出
 * @description
 * 驗證存取權限後永久移除使用者帳號。
 * 僅允許使用者刪除自己的帳號，除非是管理員或系統使用者。
 * 同時從資料庫和快取中移除使用者資料。
 */
export const deleteUser = async (
  id: string,
  requestingUser: { id: string; role: string }
): Promise<void> => {
  if (!db) {
    logger.error("資料庫連線未建立（刪除使用者時）");
    throw new Error("資料庫連線未建立");
  }

  try {
    logger.info("刪除使用者", { id, requestingUserId: requestingUser.id });

    if (!validateAccess(requestingUser, id)) {
      logger.warn("未授權刪除使用者的嘗試", {
        requestingUserId: requestingUser.id,
        targetUserId: id,
      });
      throw new AuthorizationError("未授權刪除使用者");
    }

    await db.user.delete({
      where: { id },
    });

    logger.info("使用者刪除成功", { id });
  } catch (error) {
    const typedError = error as Error;
    logger.error("刪除使用者時發生錯誤:", {
      error: typedError.message,
      stack: typedError.stack,
    });
    if (error instanceof AuthorizationError) {
      throw error;
    }
    throw new Error("刪除使用者失敗");
  }
};
