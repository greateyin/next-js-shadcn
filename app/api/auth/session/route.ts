/**
 * Session API endpoint for client-side session reading
 *
 * This endpoint is called by NextAuth's SessionProvider when useSession() is used
 * It returns the current user's session from the JWT token
 *
 * @module app/api/auth/session
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";

/**
 * GET /api/auth/session
 *
 * Returns current user's session (if exists)
 * Uses Auth.js auth() function to read JWT token from cookies
 */
export async function GET(request: Request) {
  try {
    // Log incoming request
    console.log('[SESSION_API] GET /api/auth/session - Request received');

    // Check cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('authjs.session-token') ||
                         cookieStore.get('__Secure-authjs.session-token');

    console.log('[SESSION_API] Cookies:', {
      hasSessionCookie: !!sessionCookie,
      cookieName: sessionCookie?.name,
      cookieValue: sessionCookie?.value ? '***' : 'none',
    });

    // Use Auth.js auth() function to get session from JWT token
    const session = await auth();

    console.log('[SESSION_API] Session retrieved:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
    });

    if (!session) {
      console.log('[SESSION_API] No session found, returning null');
      return NextResponse.json(null);
    }

    console.log('[SESSION_API] Returning session:', {
      userId: session.user?.id,
      userName: session.user?.name,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("[SESSION_API] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
