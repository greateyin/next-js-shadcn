/**
 * @fileoverview Email verification route handler
 * @module app/api/auth/verify
 * @description Handles email verification token validation
 * and user account activation
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/serverLogger";

/**
 * Use Node.js runtime for secure database operations
 * @constant
 */
export const runtime = "nodejs";

/**
 * Force dynamic route handling to ensure verification is always current
 * @constant
 */
export const dynamic = 'force-dynamic';

/**
 * GET request handler for email verification
 * @async
 * @function
 * @description Verifies email verification tokens by:
 * - Validating token presence
 * - Checking token existence and expiration
 * - Activating user account
 * - Cleaning up used tokens
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating verification result
 * 
 * @example
 * ```ts
 * // Client-side usage
 * const response = await fetch('/api/auth/verify?token=verification-token-123');
 * 
 * // Success response
 * // { success: "Email verified successfully" }
 * 
 * // Error responses
 * // { error: "Missing token" }
 * // { error: "Invalid token" }
 * // { error: "Token expired" }
 * ```
 * 
 * @throws {Error} If verification process fails
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    console.log("Verification API called with token:", token);

    if (!token) {
      console.log("Missing token in request");
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // First log the full token to debug
    console.log("Looking for verification token:", { token, tokenLength: token.length });

    try {
      const verificationToken = await db.verificationToken.findUnique({
        where: { token },
        select: {
          id: true,
          email: true,
          token: true,
          expires: true,
        },
      });

      console.log("Verification token lookup result:", verificationToken);

      if (!verificationToken) {
        // Log an error and return
        console.error("Invalid verification token - token not found in database:", { token });
        logger.warn("Invalid verification token", { token });
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 400 }
        );
      }

      if (verificationToken.expires < new Date()) {
        console.log("Token expired:", { 
          expires: verificationToken.expires, 
          now: new Date() 
        });
        logger.warn("Expired verification token", { token });
        return NextResponse.json(
          { error: "Token expired" },
          { status: 400 }
        );
      }

      // Find user by email and update verification status
      console.log('Verification process started:', { 
        token,
        email: verificationToken.email 
      });
      
      const user = await db.user.findUnique({
        where: { email: verificationToken.email },
        select: { 
          id: true,
          email: true,
          status: true,
          emailVerified: true 
        },
      });

      if (!user) {
        console.error("User not found for verification token", { 
          token, 
          email: verificationToken.email 
        });
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      console.log("Current user state:", { 
        userId: user.id,
        email: user.email,
        currentStatus: user.status,
        emailVerified: user.emailVerified
      });

      // Update user and cleanup token
      try {
        console.log("Updating user status to active...");
        // First update the user status
        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: { 
            emailVerified: new Date(),
            status: 'active' as const
          },
          select: {
            id: true,
            email: true,
            status: true,
            emailVerified: true
          }
        });

        console.log("User updated successfully:", { 
          userId: updatedUser.id,
          email: updatedUser.email,
          newStatus: updatedUser.status,
          emailVerified: updatedUser.emailVerified
        });
        
        // Then delete the token separately
        console.log("Deleting verification token...");
        await db.verificationToken.delete({
          where: { id: verificationToken.id }
        });
        
        console.log("Verification token deleted successfully");
        logger.info("Email verified successfully", { userId: user.id });
        
        return NextResponse.json({
          success: "Email verified successfully"
        });
      } catch (error) {
        console.error("Error during verification process:", { 
          error,
          userId: user.id,
          tokenId: verificationToken.id
        });
        logger.error("Error during verification process:", { 
          error,
          userId: user.id,
          tokenId: verificationToken.id
        });
        
        return NextResponse.json(
          { error: "Failed to update user or delete token" },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error("Database error during token lookup:", dbError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unhandled error in verification API:", error);
    logger.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
