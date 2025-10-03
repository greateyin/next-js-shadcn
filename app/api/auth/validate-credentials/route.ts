/**
 * @fileoverview Credential validation route handler
 * @module app/api/auth/validate-credentials
 * @description Validates user credentials (email/password)
 * with security headers and proper error handling
 */

import { NextResponse } from "next/server"
import { logger } from "@/lib/serverLogger"
import { createSecureResponse } from "@/lib/security/headers"
import { getUserByEmail } from "@/actions/user"
import { verifyPassword } from "@/lib/crypto"

/**
 * Use Node.js runtime for secure database operations
 * @constant
 */
export const runtime = "nodejs"

/**
 * Credential validation request type
 * @typedef {Object} CredentialRequest
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */
type CredentialRequest = {
  email: string;
  password: string;
};

/**
 * POST request handler for credential validation
 * @async
 * @function
 * @description Validates user credentials by:
 * - Checking for required fields
 * - Verifying user existence
 * - Validating password hash
 * - Applying security headers
 * 
 * @param {Request} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating validation result
 * 
 * @example
 * ```ts
 * // Client-side usage
 * const response = await fetch('/api/auth/validate-credentials', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     password: 'user-password'
 *   })
 * });
 * 
 * // Success response
 * // { valid: true }
 * 
 * // Error responses
 * // { error: "Missing credentials" }
 * // { error: "Invalid credentials" }
 * ```
 * 
 * @throws {Error} If validation process fails
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json() as CredentialRequest

    if (!email || !password) {
      logger.warn("Missing credentials")
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      )
    }

    // Use system role to access user data
    const user = await getUserByEmail(email, { id: "SYSTEM", role: "SYSTEM" }, {
      includeLoginMethods: true,
      includeSensitiveData: true
    })

    if (!user || !user.password) {
      logger.warn("Invalid credentials", { email })
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      logger.warn("Invalid password", { email })
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Return user without sensitive data
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    logger.error("Credential validation error", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
