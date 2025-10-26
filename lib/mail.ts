import { Resend } from "resend";

// For development, log emails to console if API key is missing
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// ✅ Use verified Resend domain from environment variables
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const sendVerificationEmail = async (
  email: string,
  token: string
) => {
  const confirmLink = `${domain}/auth/email-verification?token=${token}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail, // ✅ Use verified domain from env
        to: email,
        subject: "Verify your email",
        html: `<p>Click <a href="${confirmLink}">here</a> to verify your email.</p>`
      });
      console.log(`[MAIL] Verification email sent to ${email}`);
    } catch (error) {
      console.error(`[MAIL] Failed to send verification email to ${email}:`, error);
      throw error;
    }
  } else {
    // Log email details to console for development
    console.log("📧 Verification Email (Development Mode)");
    console.log("From:", fromEmail);
    console.log("To:", email);
    console.log("Subject: Verify your email");
    console.log("Verification Link:", confirmLink);
    console.log("Token:", token);
    console.log("\nNo RESEND_API_KEY found. Email not actually sent.\n");
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
) => {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail, // ✅ Use verified domain from env
        to: email,
        subject: "Reset your password",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
      });
      console.log(`[MAIL] Password reset email sent to ${email}`);
    } catch (error) {
      console.error(`[MAIL] Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  } else {
    // Log email details to console for development
    console.log("📧 Password Reset Email (Development Mode)");
    console.log("From:", fromEmail);
    console.log("To:", email);
    console.log("Subject: Reset your password");
    console.log("Reset Link:", resetLink);
    console.log("Token:", token);
    console.log("\nNo RESEND_API_KEY found. Email not actually sent.\n");
  }
};

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string
) => {
  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail, // ✅ Use verified domain from env
        to: email,
        subject: "2FA Code",
        html: `<p>Your 2FA code: ${token}</p>`
      });
      console.log(`[MAIL] 2FA email sent to ${email}`);
    } catch (error) {
      console.error(`[MAIL] Failed to send 2FA email to ${email}:`, error);
      throw error;
    }
  } else {
    // Log email details to console for development
    console.log("📧 Two-Factor Authentication Email (Development Mode)");
    console.log("From:", fromEmail);
    console.log("To:", email);
    console.log("Subject: 2FA Code");
    console.log("2FA Code:", token);
    console.log("\nNo RESEND_API_KEY found. Email not actually sent.\n");
  }
};