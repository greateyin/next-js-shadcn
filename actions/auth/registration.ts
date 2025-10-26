/**
 * @fileoverview User registration related Server Actions
 * @module actions/auth/registration
 * @description Handles user registration, email verification, password reset and other authentication flows
 */

"use server";

import * as z from "zod";
import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas/auth";
import { getUserByEmail } from "@/data/user";
import {
  generateVerificationToken,
  generatePasswordResetToken,
} from "@/lib/tokens";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/mail";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

/**
 * User registration Action
 * @async
 * @function registerAction
 * @param {z.infer<typeof RegisterSchema>} values - Registration form data
 * @returns {Promise<{error: string} | {success: string}>} Returns success or error message
 * @throws {Error} When database operation fails
 * @description
 * Handles user registration flow:
 * 1. Validate input fields
 * 2. Check if email is already in use
 * 3. Create new user account (password is hashed)
 * 4. Generate and send email verification token
 */
export const registerAction = async (
  values: z.infer<typeof RegisterSchema>
) => {
  // Validate form fields
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Field validation failed!" };
  }

  const { email, password, name } = validatedFields.data;
  
  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Check if email is already in use
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "This email is already in use!" };
  }

  // Create new user
  // ⚠️ SECURITY: Do NOT set role field - roles are assigned via UserRole join table
  // Default role will be assigned after email verification
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      // status defaults to 'pending' - requires email verification
      // role field does not exist in User model - use UserRole join table instead
    },
  });

  // Generate and send verification token
  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(email, verificationToken.token);

  return { success: "Verification email has been sent!" };
};

/**
 * Resend verification email Action
 * @async
 * @function resendVerificationEmail
 * @param {string} email - Email address to resend verification email to
 * @returns {Promise<{error: string} | {success: string}>} Returns success or error message
 * @description
 * Regenerate and send email verification token to the specified email address.
 * Email is only sent if the user exists.
 */
export const resendVerificationEmail = async (email: string) => {
  // Check if user exists
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return { error: "Email not found!" };
  }

  // Generate new verification token and send email
  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(email, verificationToken.token);

  return { success: "Verification email has been resent!" };
};
