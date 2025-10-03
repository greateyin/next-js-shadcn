// lib/emailByResent.ts
import { Resend } from "resend";
import { logger } from './serverLogger';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
        logger.info('Sending email', { to, subject });
        const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
        logger.info('Email sent', { to, subject, id: result.data?.id });
    } catch (error) {
        logger.error('Email send error', { to, subject, error: (error as Error).message });
        throw new Error(`Failed to send email: ${subject}`);
    }
}

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
    const confirmLink = `${BASE_URL}/auth/email-verification?token=${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Verify your email</h2>
        <p style="color: #555;">Please click the link below to verify your email address:</p>
        <p style="text-align: center;"><a href="${confirmLink}" style="color: #1a73e8;">${confirmLink}</a></p>
    </div>`;
    await sendEmail(email, "Verify your email", html);
};

export const sendForgotPasswordEmail = async (email: string, token: string): Promise<void> => {
    const resetLink = `${BASE_URL}/auth/reset-password?token=${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
        <p style="color: #555;">You have requested to reset your password. Please click the link below to set a new password:</p>
        <p style="text-align: center;"><a href="${resetLink}" style="color: #1a73e8;">${resetLink}</a></p>
        <p style="color: #555;">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
    await sendEmail(email, "Reset Your Password", html);
};

export const sendSetPasswordEmail = async (email: string, token: string): Promise<void> => {
    const setPasswordLink = `${BASE_URL}/auth/reset-password?token=${token}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Set Your Password</h2>
        <p style="color: #555;">Please click the link below to set a password for your account:</p>
        <p style="text-align: center;"><a href="${setPasswordLink}" style="color: #1a73e8;">${setPasswordLink}</a></p>
    </div>`;
    await sendEmail(email, "Set Your Password", html);
};

export const sendTwoFactorTokenEmail = async (email: string, token: string): Promise<void> => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Your Two-Factor Authentication Code</h2>
        <div style="font-size: 24px; font-weight: bold; background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            ${token}
        </div>
        <p style="color: #555;">If you didn't request this, please ignore this email.</p>
        <p style="color: #555;">Don't share this code with anyone.</p>
    </div>`;
    await sendEmail(email, "Your Two-Factor Authentication Code", html);
};