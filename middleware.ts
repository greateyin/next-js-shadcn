/**
 * @fileoverview Next.js Middleware for authentication and authorization
 * @module middleware
 * @description Auth.js V5+ middleware with role-based access control
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { ADMIN_LOGIN_REDIRECT, DEFAULT_LOGIN_REDIRECT } from "@/routes"

/**
 * Authentication and authorization middleware
 * Implements Auth.js V5 recommended pattern for Next.js 15+ App Router
 */
export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user

  const userHasAdminPrivileges = Boolean(
    user && (
      user.roleNames?.includes('admin') ||
      user.roleNames?.includes('super-admin') ||
      user.role === 'admin' ||
      user.role === 'super-admin'
    )
  )

  // Define route types
  const isAuthPage = pathname.startsWith('/auth')
  const isPublicRoute = pathname.startsWith('/api/public') || pathname === '/'
  const isAdminPage = pathname.startsWith('/admin')
  const isApiAdminRoute = pathname.startsWith('/api/admin')
  const isDashboardPage = pathname.startsWith('/dashboard')

  if (req.auth && isAuthPage) {
    const target = userHasAdminPrivileges ? ADMIN_LOGIN_REDIRECT : DEFAULT_LOGIN_REDIRECT
    const url = req.nextUrl.clone()
    url.pathname = target
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Unauthenticated user trying to access protected routes -> redirect to login
  if (!req.auth && !isAuthPage && !isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Dashboard is accessible to all authenticated users
  // Menu items are controlled dynamically based on user roles

  // Role-based access control for admin routes
  if (req.auth && (isAdminPage || isApiAdminRoute)) {
    if (!user?.id) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    const appPath = pathname.split('/')[2] // Extract /admin/[app]
    const hasAppAccess = user.applicationPaths?.includes(appPath)

    if (!userHasAdminPrivileges && !hasAppAccess) {
      const url = req.nextUrl.clone()
      url.pathname = '/no-access'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

/**
 * Middleware configuration
 * Excludes API routes, static files, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
