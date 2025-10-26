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

/**
 * GET /api/auth/session
 *
 * Returns current user's session (if exists)
 * Uses Auth.js auth() function to read JWT token from cookies
 */
export async function GET() {
  try {
    // Use Auth.js auth() function to get session from JWT token
    const session = await auth();

    console.log('[SESSION_API] GET /api/auth/session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
    });

    if (!session) {
      return NextResponse.json(null);
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("[SESSION_API] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
