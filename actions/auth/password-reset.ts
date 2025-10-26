/**
 * @fileoverview Password reset related Server Actions - Auth.js V5 Best Practices
 * @module actions/auth/password-reset
 * @description Handles password reset requests and new password setup using Server Actions pattern
 */

"use server";

import * as z from "zod";
import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

/**
 * Email validation schema
 */
const EmailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

/**
 * New password validation schema with strength requirements
 */
const NewPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Initiate password reset flow - Server Action
 * @async
 * @function requestPasswordResetAction
 * @param {any} prevState - Previous state (provided by useActionState)
 * @param {FormData} formData - Form data containing email
 * @returns {Promise<{error: string} | {success: string}>} Returns success or error message
 * @description
 * Handles password reset requests:
 * 1. Validate form data
 * 2. Verify user exists
 * 3. Generate password reset token
 * 4. Send email with reset link
 * 
 * @example
 * ```tsx
 * // Using useActionState
 * const [state, formAction] = useActionState(requestPasswordResetAction, undefined);
 * <form action={formAction}>
 *   <input name="email" type="email" required />
 *   <button type="submit">Send Reset Link</button>
 * </form>
 * ```
 */
export const requestPasswordResetAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  try {
    // Extract email from FormData
    const email = formData.get("email") as string;

    // Validate email format
    const validatedFields = EmailSchema.safeParse({ email });

    if (!validatedFields.success) {
      return { error: "Please enter a valid email address" };
    }

    // Check if user exists
    const existingUser = await getUserByEmail(validatedFields.data.email);

    if (!existingUser) {
      // Security consideration: Return success message even if user doesn't exist to avoid exposing user existence
      return { success: "If the email exists, a reset link has been sent!" };
    }

    // ✅ Allow OAuth users to set a password via reset flow
    // This enables OAuth users to also use email/password login
    // No error if password is not set - we'll create one

    // Generate password reset token and send email
    const passwordResetToken = await generatePasswordResetToken(
      validatedFields.data.email
    );
    await sendPasswordResetEmail(
      validatedFields.data.email,
      passwordResetToken.token
    );

    return { success: "Reset email has been sent! Please check your inbox." };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "An error occurred while sending reset email. Please try again later." };
  }
};

/**
 * Legacy version of resetPassword - Kept for backward compatibility
 * @deprecated Please use requestPasswordResetAction
 */
export const resetPassword = async (email: string) => {
  const formData = new FormData();
  formData.append("email", email);
  return requestPasswordResetAction(undefined, formData);
};

/**
 * Set new password using reset token - Server Action
 * @async
 * @function resetPasswordWithTokenAction
 * @param {any} prevState - Previous state (provided by useActionState)
 * @param {FormData} formData - Form data containing token, password, confirmPassword
 * @returns {Promise<{error: string} | {success: string}>} Returns success or error message
 * @description
 * Handles new password setup:
 * 1. Validate form data and password strength
 * 2. Verify token is valid and not expired
 * 3. Verify user exists
 * 4. Update user password (hashed)
 * 5. Delete used reset token
 * 6. Clear all existing sessions (force re-login)
 * 
 * @example
 * ```tsx
 * // Using useActionState
 * const [state, formAction] = useActionState(resetPasswordWithTokenAction, undefined);
 * <form action={formAction}>
 *   <input type="hidden" name="token" value={token} />
 *   <input name="password" type="password" required />
 *   <input name="confirmPassword" type="password" required />
 *   <button type="submit">Reset Password</button>
 * </form>
 * ```
 */
export const resetPasswordWithTokenAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  try {
    // Extract data from FormData
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate input
    if (!token) {
      return { error: "Reset token is missing!" };
    }

    // Validate password format and strength
    const validatedFields = NewPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validatedFields.success) {
      const errors = validatedFields.error.errors.map((err) => err.message);
      return { error: errors[0] }; // Return first error message
    }

    // Check if token exists
    const existingToken = await getPasswordResetTokenByToken(token);

    if (!existingToken) {
      return { error: "Invalid reset token!" };
    }

    // Check if token has expired
    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      // Delete expired token
      await db.passwordResetToken.delete({
        where: { id: existingToken.id },
      });
      return { error: "Reset token has expired! Please request a new password reset." };
    }

    // Check if user exists
    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
      return { error: "User does not exist!" };
    }

    // Hash the new password
    const hashedPassword = await hashPassword(validatedFields.data.password);

    // Update user password
    await db.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });

    // Delete used reset token
    await db.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    // Clear all sessions for this user (force re-login for security)
    await db.session.deleteMany({
      where: { userId: existingUser.id },
    });

    return {
      success: "Password reset successful! Please login with your new password."
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "An error occurred while resetting password. Please try again later." };
  }
};

/**
 * Legacy version of newPasswordAction - Kept for backward compatibility
 * @deprecated Please use resetPasswordWithTokenAction
 */
export const newPasswordAction = async (token: string, password: string) => {
  const formData = new FormData();
  formData.append("token", token);
  formData.append("password", password);
  formData.append("confirmPassword", password);
  return resetPasswordWithTokenAction(undefined, formData);
};
