/**
 * @fileoverview Authentication error logging route handler
 * @module app/api/auth/_log
 * @description Handles logging of authentication-related errors
 * for debugging and monitoring purposes
 */

import { NextResponse } from "next/server";

/**
 * Force dynamic route handling to ensure logs are always processed
 * @constant
 */
export const dynamic = 'force-dynamic';

/**
 * POST request handler for auth error logging
 * @async
 * @function
 * @description Logs authentication errors to the server console
 * and returns a confirmation response
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating log status
 * 
 * @example
 * ```ts
 * // Client-side usage
 * await fetch('/api/auth/_log', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     error: 'Invalid credentials',
 *     timestamp: new Date(),
 *     userId: 'user_123'
 *   })
 * });
 * ```
 * 
 * @throws {Error} If request body cannot be parsed or logging fails
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.error("Auth Error:", body);
    return NextResponse.json({ status: "logged" });
  } catch (error) {
    console.error("Error logging auth error:", error);
    return NextResponse.json(
      { error: "Failed to log error" },
      { status: 500 }
    );
  }
}
