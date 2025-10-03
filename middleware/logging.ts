/**
 * @fileoverview Server-side logging middleware
 * @module middleware/logging
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ipAddress } from '@vercel/functions';

// Simple logger for development
const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export function middleware(request: NextRequest) {
  // Log request information
  logger.info('Incoming request', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    ip: ipAddress(request) || 
       request.headers.get('x-forwarded-for') || 
       request.headers.get('x-real-ip') || 
       'unknown',
  });

  // Continue to the next middleware or route handler
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
