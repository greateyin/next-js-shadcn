/**
 * @fileoverview Centralized export point for authentication-related Server Actions
 * @module actions/auth
 * @description Unified exports for all authentication-related Server Actions
 */

// Login/logout related
export {
  loginAction,
  loginWithRedirectAction,
  loginNoRedirectAction,
  logoutAction,
} from "./login";

export { loginFormAction } from "./login-action-wrapper";

// User registration related
export {
  registerAction,
  resendVerificationEmail,
} from "./registration";

// Password reset related
export {
  // New version - Using Server Actions (recommended)
  requestPasswordResetAction,
  resetPasswordWithTokenAction,
  // Legacy version - Backward compatibility
  resetPassword,
  newPasswordAction,
} from "./password-reset";

// Two-factor authentication related
export {
  getTwoFactorTokenByToken,
  getTwoFactorTokenByUserId,
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "./two-factor";

// Email verification related
export {
  getVerificationTokenByToken,
  getVerificationTokenByEmail,
  getEmailFromToken,
} from "./verification";
