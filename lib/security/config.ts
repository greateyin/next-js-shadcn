/**
 * Security configuration for the application
 */

const oauthProviderMatrix: Array<{ name: string; env: [string, string] }> = [
  { name: "google", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { name: "github", env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] },
  { name: "facebook", env: ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"] },
  { name: "apple", env: ["AUTH_APPLE_ID", "AUTH_APPLE_SECRET"] },
  { name: "line", env: ["LINE_CLIENT_ID", "LINE_CLIENT_SECRET"] },
]

const enabledOAuthProviders = oauthProviderMatrix
  .filter(({ env }) => env.every(key => {
    const value = process.env[key]
    return typeof value === "string" && value.length > 0
  }))
  .map(({ name }) => name)

export const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimit: {
    window: 60 * 1000, // 1 minute in milliseconds
    maxRequests: 100,
    cacheTTL: 2 * 60 * 1000, // 2 minutes
  },

  // Session configuration
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // 24 hours in seconds
  },

  // Cache configuration
  cache: {
    verification: {
      ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
      maxAttempts: 5,
    },
    user: {
      ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
    },
  },

  // Security headers
  headers: {
    default: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    },
    auth: {
      "Cache-Control": "no-store, max-age=0",
      "Clear-Site-Data": '"cache", "cookies", "storage"',
    },
  },

  // CSRF protection
  csrf: {
    tokenLength: 32,
    cookieName: "csrf-token",
    headerName: "X-CSRF-Token",
  },

  // Password requirements
  password: {
    minLength: 8,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercase: true,
    requireLowercase: true,
  },

  // OAuth configuration
  oauth: {
    providers: enabledOAuthProviders,
    allowEmailLinking: true,
  },

  // Cookie configuration
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    httpOnly: true,
  },
} as const

// Export individual configurations for easier imports
export const { rateLimit, session, cache, headers, csrf, password, oauth, cookie } = SECURITY_CONFIG
