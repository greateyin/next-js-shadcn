/**
 * Lightweight Session API - for client-side session reading in sub-applications
 * 
 * This endpoint allows sub-application's useSession() to access same-origin, avoiding CORS issues
 */

import { NextResponse } from "next/server";
import { getSubdomainSession } from "@/lib/auth/subdomain-auth";

/**
 * GET /api/auth/session
 * 
 * Returns current user's session (if exists)
 */
export async function GET() {
  try {
    const session = await getSubdomainSession();
    
    if (!session) {
      return NextResponse.json(null);
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error("[SESSION_API]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
