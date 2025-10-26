/**
 * Interface for email sending parameters
 * @interface EmailParams
 */
type EmailParams = {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Plain text content of the email */
  text: string;
  /** Optional HTML content of the email */
  html?: string;
};

/**
 * Sends an email using the Resend API
 * @async
 * @param {EmailParams} params - The email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.text - Plain text content
 * @param {string} [params.html] - Optional HTML content
 * @throws {Error} When email sending fails
 * @returns {Promise<void>}
 */
export async function sendEmail({ to, subject, text, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[MAIL] RESEND_API_KEY not set, skipping email send");
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  // ✅ Use verified Resend domain from environment variables
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const result = await resend.emails.send({
      from: fromEmail, // ✅ Use verified domain from env
      to,
      subject,
      text,
      html: html || text,
    });
    console.log(`[MAIL] Email sent successfully to ${to}`, { id: result.data?.id });
  } catch (error) {
    console.error(`[MAIL] Failed to send email to ${to}:`, error);
    throw new Error('Failed to send email');
  }
}