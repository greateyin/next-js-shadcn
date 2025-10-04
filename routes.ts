// routes.ts

/**
 * Authentication route configuration
 */

// Public routes that don't require authentication
export const publicRoutePaths = [
    "/",
    "/auth/verify-email",
    "/auth/callback",
    "/auth/error",
    "/auth/reset-password",
    "/auth/new-password",
    "/promote",
] as const;

// Authentication-specific routes
export const authRoutePaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/verify-email",
    "/auth/new-password",
    "/auth/reset-password",
    "/auth/error",
    "/auth/unauthorized",
    "/auth/verify-request",
] as const;

// Protected routes that require authentication
export const protectedRoutePaths = [
    "/dashboard",
    "/profile",
    "/settings",
] as const;

// Admin-only routes
export const adminRoutePaths = [
    "/admin",
    "/admin/users",
    "/admin/settings",
] as const;

// API authentication routes
export const apiAuthRoutePaths = {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    verify: "/api/auth/verify",
    resetPassword: "/api/auth/reset-password",
    validateCredentials: "/api/auth/validate-credentials",
    twoFactor: "/api/auth/2fa",
    providers: "/api/auth/providers",
} as const;

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
export const ADMIN_LOGIN_REDIRECT = "/admin";
export const DEFAULT_UNAUTHORIZED_REDIRECT = "/auth/unauthorized";
