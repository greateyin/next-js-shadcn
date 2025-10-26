/**
 * @fileoverview Next.js 15+ Middleware for Auth.js V5
 * @module middleware
 * @description Edge Runtime compatible authentication middleware with RBAC
 * 
 * Architecture:
 * - Runs on Vercel Edge Runtime (globally distributed, low latency)
 * - Uses getToken() from next-auth/jwt (Edge-compatible, no database)
 * - JWT contains all RBAC data: roleNames, permissionNames, applicationPaths
 * - Zero database queries = fastest auth checks possible
 * 
 * Edge Runtime Compatibility:
 * ✅ Uses Web APIs only (fetch, URL, Response)
 * ✅ No Node.js globals (__dirname, fs, etc.)
 * ✅ No database connections (Prisma, etc.)
 * ✅ Lightweight JWT validation only
 * 
 * @see https://authjs.dev/guides/edge-compatibility
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://vercel.com/docs/functions/runtimes#edge-runtime
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { edgeAuthConfig } from "./auth.edge.config"
import type { AuthStatus } from "@/types/next-auth"

// Create auth instance for middleware
// Using direct export pattern from Auth.js V5 docs
const { auth: authMiddleware } = NextAuth(edgeAuthConfig)

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default redirect for authenticated regular users */
const DEFAULT_LOGIN_REDIRECT = "/dashboard"

/** Default redirect for authenticated admin users */
const ADMIN_LOGIN_REDIRECT = "/admin"

/** Admin role names that have full system access */
const ADMIN_ROLES = ['admin', 'super-admin'] as const

// =============================================================================
// TYPES
// =============================================================================

/**
 * Extended JWT type with RBAC data
 * Contains all authorization info needed for middleware checks
 */
interface AuthJWT {
  /** User ID */
  id?: string
  /** User email */
  email?: string
  /** User display name */
  name?: string | null
  /** User account status */
  status?: AuthStatus
  /** Legacy role field (for backward compatibility) */
  role?: string
  /** Array of role names ['admin', 'user', etc.] */
  roleNames?: string[]
  /** Array of permission names ['users.read', 'posts.write', etc.] */
  permissionNames?: string[]
  /** Array of application paths user can access ['users', 'posts', etc.] */
  applicationPaths?: string[]
}

// =============================================================================
// NOTE: RBAC HELPER FUNCTIONS MOVED
// =============================================================================
// RBAC helper functions have been moved to lib/auth/admin-check.ts
// They are no longer used in middleware because custom JWT fields
// (roleNames, permissionNames, applicationPaths) are not available in Edge Runtime.
//
// RBAC checks are now done in:
// - Server Components (using auth() function)
// - API routes (using auth() function)
// - Layout components (using auth() function)

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Next.js 15+ Middleware with Auth.js V5
 *
 * Runs on Edge Runtime by default (no runtime export needed)
 * Uses getToken() for direct JWT access with all custom fields
 *
 * @param request - Next.js request object
 * @returns NextResponse (redirect or next())
 */

// Middleware function with custom logic
async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // =========================================================================
    // 1. GET JWT TOKEN (Edge Runtime Compatible)
    // =========================================================================

    // ✅ Use request.auth to access JWT
    // NOTE: request.auth only contains standard JWT fields (sub, email, name, etc.)
    // Custom fields (roleNames, permissionNames, applicationPaths) are NOT available in Edge Runtime
    // RBAC checks must be done in Server Components or API routes instead

    const token = (request as any).auth as AuthJWT | null
    const isAuthenticated = !!token

    // ⚠️ SECURITY: Do NOT log token email, sub, or other PII
    // Middleware logs are often centralized and may be accessible to unauthorized users

    // =========================================================================
    // 2. DEFINE ROUTE TYPES
    // =========================================================================

    const isAuthPage = pathname.startsWith('/auth')
    const isPublicRoute = pathname === '/' || pathname.startsWith('/api/public')
    const isAdminPage = pathname.startsWith('/admin')
    const isApiAdminRoute = pathname.startsWith('/api/admin')

    // =========================================================================
    // 3. AUTHENTICATED USER ON AUTH PAGES
    // =========================================================================
    // If user is already logged in and tries to access login/register pages,
    // redirect them to their appropriate dashboard

    if (isAuthenticated && isAuthPage) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url))
    }

    // =========================================================================
    // 4. UNAUTHENTICATED USER ON PROTECTED ROUTES
    // =========================================================================
    // If user is not logged in and tries to access protected pages,
    // redirect to login with callback URL

    if (!isAuthenticated && !isAuthPage && !isPublicRoute) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // =========================================================================
    // 5. ADMIN/API ADMIN ROUTES - BASIC AUTHENTICATION CHECK ONLY
    // =========================================================================
    // NOTE: RBAC checks are NOT done in middleware because custom JWT fields
    // (roleNames, permissionNames, applicationPaths) are NOT available in Edge Runtime.
    //
    // Middleware only checks if user is authenticated.
    // Detailed RBAC validation happens in:
    // - Server Components (using auth() function)
    // - API routes (using auth() function)
    // - Layout components (using auth() function)

    if (isAdminPage || isApiAdminRoute) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
      // Allow authenticated users to proceed
      // RBAC validation will happen in the page/route handler
      return NextResponse.next()
    }

    // =========================================================================
    // 6. ALLOW ACCESS
    // =========================================================================
    // Public routes or authenticated users accessing allowed pages

    return NextResponse.next()
  } catch (error) {
    // ⚠️ SECURITY: Do NOT log error details in middleware
    // Error stacks may contain sensitive information
    // Allow request to proceed even if middleware fails
    return NextResponse.next()
  }
}

// Export middleware with auth() wrapper
// This ensures request.auth is properly injected
export default authMiddleware(middleware)

/**
 * Middleware configuration
 * Excludes API auth routes, static files, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (Auth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png (favicon files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon\.ico|favicon\.png).*)',
  ],
}
