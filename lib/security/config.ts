/**
 * Security configuration for the application
 */

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
    providers: ["github", "google"],
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
