import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";

/**
 * Generate a password reset token for a user
 * @param email - The user's email
 * @returns The generated token and its expiry date
 */
export async function generatePasswordResetToken(email: string) {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  const existingUser = await db.user.findUnique({
    where: { email }
  });

  // Delete existing token if there is one
  const existingToken = await getPasswordResetTokenByEmail(email);
  if (existingToken) {
    await db.passwordResetToken.delete({
      where: { id: existingToken.id }
    });
  }

  // Create token
  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
      userId: existingUser?.id  // Make userId optional
    }
  });

  return passwordResetToken;
}

/**
 * Generate a verification token for a user
 * @param email - The user's email
 * @returns The generated token and its expiry date
 */
export async function generateVerificationToken(email: string) {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id
      }
    });
  }

  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return verificationToken;
}
