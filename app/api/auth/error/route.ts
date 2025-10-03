/**
 * @fileoverview Authentication error handling route
 * @module app/api/auth/error
 * @description Handles authentication errors and provides
 * user-friendly error messages for different scenarios
 */

import { NextResponse } from "next/server"
import { logger } from "@/lib/serverLogger"

/**
 * Force dynamic route handling to ensure errors are always processed
 * @constant
 */
export const dynamic = 'force-dynamic'

/**
 * Error message mappings
 * @type {Record<string, string>}
 */
const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to access this resource.",
  Verification: "The verification token is invalid or has expired.",
  Default: "An authentication error occurred."
}

/**
 * GET request handler for auth errors
 * @async
 * @function
 * @description Processes authentication errors and returns
 * user-friendly error messages based on the error type
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with error message
 * 
 * @example
 * ```ts
 * // Client-side usage
 * const response = await fetch('/api/auth/error?error=AccessDenied');
 * const data = await response.json();
 * // data = { error: "You do not have permission to access this resource." }
 * 
 * // Handle configuration error
 * const configError = await fetch('/api/auth/error?error=Configuration');
 * // Response: { error: "There is a problem with the server configuration." }
 * 
 * // Handle verification error
 * const verifyError = await fetch('/api/auth/error?error=Verification');
 * // Response: { error: "The verification token is invalid or has expired." }
 * ```
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get('error')
  
  logger.error("Authentication error", { error })
  
  return NextResponse.json({ 
    error: errorMessages[error as string] || errorMessages.Default 
  })
}
