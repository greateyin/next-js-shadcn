/**
 * TEMPORARY: Middleware Disabled to Fix __dirname Error
 * 
 * This middleware has been temporarily disabled due to __dirname compatibility
 * issues in Vercel Edge Runtime. Authentication is now handled at page level.
 * 
 * TODO: Re-enable once next-auth v5 Edge Runtime compatibility is confirmed
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Minimal pass-through middleware
 * Authentication is handled by individual pages and layouts
 */
export function middleware(request: NextRequest) {
  // Pass all requests through
  // Auth will be checked in:
  // - Page layouts (app/dashboard/layout.tsx, app/admin/layout.tsx)
  // - API routes (via checkAuth helper)
  return NextResponse.next()
}

/**
 * Middleware configuration
 * Minimal matcher - just prevent from running on static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png (favicon files)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon\.ico|favicon\.png).*)',
  ],
}
