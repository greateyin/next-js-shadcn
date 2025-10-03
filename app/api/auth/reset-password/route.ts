/**
 * @fileoverview Password reset route handler
 * @module app/api/auth/reset-password
 * @description Handles password reset functionality including
 * token validation and password updates
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/passwordUtil";
import { z } from "zod";

/**
 * Password reset request validation schema
 * @constant
 * @type {z.ZodObject}
 */
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

/**
 * POST request handler for password reset
 * @async
 * @function
 * @description Processes password reset requests by:
 * - Validating the reset token
 * - Checking token expiration
 * - Updating the user's password
 * - Cleaning up used tokens
 * 
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 * 
 * @example
 * ```ts
 * // Client-side usage
 * const response = await fetch('/api/auth/reset-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     token: 'valid-reset-token',
 *     password: 'new-password-123'
 *   })
 * });
 * 
 * // Success response
 * // { success: "Password updated successfully" }
 * 
 * // Error responses
 * // { error: "Token is invalid or has expired" }
 * // { error: "Invalid password reset request" }
 * ```
 * 
 * @throws {z.ZodError} If request validation fails
 * @throws {Error} If database operations fail
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        expires: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token is invalid" },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Check if userId exists
    if (!resetToken.userId) {
      return NextResponse.json(
        { error: "User not found for this token" },
        { status: 400 }
      );
    }

    // Update password and cleanup token
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return NextResponse.json({
      success: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid password reset request" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}