/**
 * @fileoverview 認證相關 Server Actions 的集中匯出點
 * @module actions/auth
 * @description 統一匯出所有認證相關的 Server Actions
 */

// 使用者註冊相關
export {
  registerAction,
  resendVerificationEmail,
} from "./registration";

// 密碼重置相關
export {
  resetPassword,
  newPasswordAction,
} from "./password-reset";

// 雙因素認證相關
export {
  getTwoFactorTokenByToken,
  getTwoFactorTokenByUserId,
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "./two-factor";

// 電子郵件驗證相關
export {
  getVerificationTokenByToken,
  getVerificationTokenByEmail,
  getEmailFromToken,
} from "./verification";
