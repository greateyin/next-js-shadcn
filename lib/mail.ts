import { Resend } from "resend";

// For development, log emails to console if API key is missing
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// ✅ Use verified Resend domain from environment variables
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const brandColor = "#6366f1";
const backgroundColor = "#f3f4f6";
const textColor = "#111827";

type EmailTemplateInput = {
  title: string;
  message: string;
  secondaryMessage?: string;
  buttonText: string;
  buttonUrl: string;
  footerNote?: string;
};

const buildEmailHtml = ({
  title,
  message,
  secondaryMessage,
  buttonText,
  buttonUrl,
  footerNote
}: EmailTemplateInput) => {
  const previewText = secondaryMessage ?? message;

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:${backgroundColor}; font-family:'Segoe UI', Arial, sans-serif; color:${textColor};">
      <div style="display:none; max-height:0; overflow:hidden;">${previewText}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 20px 45px rgba(15,23,42,0.08);">
              <tr>
                <td style="padding: 40px 32px;">
                  <div style="font-size:24px; font-weight:600; margin-bottom:12px; color:${textColor};">${title}</div>
                  <p style="margin:0 0 12px; font-size:16px; line-height:24px; color:#374151;">${message}</p>
                  ${secondaryMessage ? `<p style="margin:0 0 24px; font-size:15px; line-height:24px; color:#4b5563;">${secondaryMessage}</p>` : ""}
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0 24px;">
                    <tr>
                      <td align="center" style="border-radius:9999px;" bgcolor="${brandColor}">
                        <a href="${buttonUrl}" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">${buttonText}</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 24px; font-size:14px; line-height:22px; color:#6b7280;">If the button doesn’t work, copy and paste this URL into your browser:</p>
                  <p style="word-break:break-all; font-size:13px; line-height:20px; color:${brandColor}; margin:0 0 32px;">${buttonUrl}</p>
                  ${footerNote ? `<p style="margin:0; font-size:13px; line-height:20px; color:#9ca3af;">${footerNote}</p>` : ""}
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0; font-size:12px; color:#9ca3af;">You’re receiving this email because it was requested from ${domain.replace(/^https?:\/\//, "")}.</p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

const buildEmailText = ({
  title,
  message,
  secondaryMessage,
  buttonText,
  buttonUrl,
  footerNote
}: EmailTemplateInput) => {
  return [
    title,
    "",
    message,
    secondaryMessage,
    "",
    `${buttonText}: ${buttonUrl}`,
    footerNote,
    "",
    `If you did not request this email, you can safely ignore it.`
  ]
    .filter(Boolean)
    .join("\n");
};

export const sendVerificationEmail = async (
  email: string,
  token: string
) => {
  const confirmLink = `${domain}/auth/email-verification?token=${token}`;

  if (resend) {
    try {
      const content: EmailTemplateInput = {
        title: "Verify your email address",
        message: "Thanks for getting started! Let’s confirm your email address so you can access your account.",
        secondaryMessage: "Click the button below to finish verifying your email address. This confirmation link will expire in 60 minutes.",
        buttonText: "Verify email",
        buttonUrl: confirmLink,
        footerNote: "Didn’t request this email? You can safely ignore it."
      }

      await resend.emails.send({
        from: fromEmail, // ✅ Use verified domain from env
        to: email,
        subject: "Verify your email",
        html: buildEmailHtml(content),
        text: buildEmailText(content)
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
    console.log("Preview:", "Verify your email address →", confirmLink);
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
      const content: EmailTemplateInput = {
        title: "Reset your password",
        message: "We received a request to reset the password associated with your account.",
        secondaryMessage: "If this was you, tap the button below to choose a new password. This link will expire in 60 minutes.",
        buttonText: "Create a new password",
        buttonUrl: resetLink,
        footerNote: "If you didn’t request a password reset, you can safely ignore this email."
      }

      await resend.emails.send({
        from: fromEmail, // ✅ Use verified domain from env
        to: email,
        subject: "Reset your password",
        html: buildEmailHtml(content),
        text: buildEmailText(content)
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
    console.log("Preview:", "Reset your password →", resetLink);
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