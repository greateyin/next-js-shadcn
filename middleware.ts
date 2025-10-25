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
import { getToken } from "next-auth/jwt"
import type { AuthStatus } from "@/types/next-auth"

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
// RBAC HELPER FUNCTIONS
// =============================================================================

/**
 * Check if user has admin privileges
 * Admins have unrestricted access to all admin routes
 * 
 * @param token - JWT token containing RBAC data
 * @returns true if user is admin or super-admin
 */
export function hasAdminPrivileges(token: AuthJWT | null): boolean {
  if (!token) return false
  
  // Check roleNames array (primary method)
  if (Array.isArray(token.roleNames)) {
    return token.roleNames.some(role => ADMIN_ROLES.includes(role as any))
  }
  
  // Fallback to legacy role field
  return ADMIN_ROLES.includes(token.role as any)
}

/**
 * Check if user has a specific permission
 * More granular than role-based checks
 * 
 * @param token - JWT token containing RBAC data
 * @param permission - Permission name (e.g., 'users.read', 'posts.write')
 * @returns true if user has the permission
 * 
 * @example
 * ```ts
 * if (hasPermission(token, 'users.delete')) {
 *   // User can delete users
 * }
 * ```
 */
export function hasPermission(token: AuthJWT | null, permission: string): boolean {
  if (!token?.permissionNames) return false
  return token.permissionNames.includes(permission)
}

/**
 * Check if user has access to a specific application module
 * Used for application-level access control
 * 
 * @param token - JWT token containing RBAC data
 * @param appPath - Application path (e.g., 'users', 'settings')
 * @returns true if user has access to the application
 * 
 * @example
 * ```ts
 * // Check if user can access /admin/users
 * if (hasApplicationAccess(token, 'users')) {
 *   // User can access users module
 * }
 * ```
 */
export function hasApplicationAccess(token: AuthJWT | null, appPath: string): boolean {
  if (!token?.applicationPaths) return false
  return token.applicationPaths.includes(appPath)
}

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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // =========================================================================
  // 1. GET JWT TOKEN (Edge Runtime Compatible)
  // =========================================================================

  // ✅ Use getToken() to access JWT directly with all custom fields
  // This includes roleNames, permissionNames, applicationPaths
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  }) as AuthJWT | null

  const isAuthenticated = !!token
  const userHasAdminPrivileges = hasAdminPrivileges(token)

  // Debug: Log full token to see what fields are present
  if (isAuthenticated) {
    console.log('[Middleware] Full token:', JSON.stringify(token, null, 2))
  }

  console.log('[Middleware] Request:', {
    pathname,
    isAuthenticated,
    hasToken: !!token,
    tokenEmail: token?.email,
    tokenRoles: token?.roleNames,
    userHasAdminPrivileges
  })

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
    const target = userHasAdminPrivileges ? ADMIN_LOGIN_REDIRECT : DEFAULT_LOGIN_REDIRECT
    return NextResponse.redirect(new URL(target, request.url))
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
  // 5. ADMIN/API ADMIN ROUTES - RBAC ENFORCEMENT
  // =========================================================================
  // Three-tier access control:
  // 1. Must be authenticated (checked above)
  // 2. Must have admin role OR specific application access
  // 3. Must have valid user ID in token
  
  if (isAuthenticated && (isAdminPage || isApiAdminRoute)) {
    // Security check: Ensure token has user ID
    if (!token?.id) {
      console.warn('[Middleware] Token missing user ID, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // Extract application path from URL
    // Example: /admin/users/123 -> appPath = 'users'
    const pathSegments = pathname.split('/')
    const appPath = pathSegments[2] // /admin/[appPath]/...
    
    // Check 1: Admin privileges (full access)
    if (userHasAdminPrivileges) {
      return NextResponse.next()
    }
    
    // Check 2: Application-specific access
    if (appPath && hasApplicationAccess(token, appPath)) {
      return NextResponse.next()
    }
    
    // No access - redirect to no-access page
    console.warn(`[Middleware] Access denied for user ${token.id} to ${pathname}`)
    return NextResponse.redirect(new URL('/no-access', request.url))
  }
  
  // =========================================================================
  // 6. ALLOW ACCESS
  // =========================================================================
  // Public routes or authenticated users accessing allowed pages

  return NextResponse.next()
}

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
