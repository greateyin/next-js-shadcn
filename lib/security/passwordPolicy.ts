import { hashPassword as cryptoHashPassword, verifyPassword as cryptoVerifyPassword, generateSecurePassword as cryptoGenerateSecurePassword } from '@/lib/crypto';
import { z } from 'zod';
import { logger } from '@/lib/serverLogger';

// Password policy configuration
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_HISTORY_SIZE = 5;

// Password validation schema
export const passwordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be less than ${PASSWORD_MAX_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export class PasswordPolicy {
    static async hashPassword(password: string): Promise<string> {
        try {
            return await cryptoHashPassword(password);
        } catch (error) {
            logger.error('Error hashing password', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Error hashing password');
        }
    }

    static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await cryptoVerifyPassword(password, hashedPassword);
        } catch (error) {
            logger.error('Error verifying password', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Error verifying password');
        }
    }

    static validatePassword(password: string): z.SafeParseReturnType<string, string> {
        return passwordSchema.safeParse(password);
    }

    static async checkPasswordHistory(
        newPassword: string,
        passwordHistory: string[]
    ): Promise<boolean> {
        try {
            // Check if the new password matches any of the previous passwords
            for (const oldHash of passwordHistory) {
                if (await this.verifyPassword(newPassword, oldHash)) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            logger.error('Error checking password history', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Error checking password history');
        }
    }

    static updatePasswordHistory(
        passwordHistory: string[],
        newPasswordHash: string
    ): string[] {
        // Keep only the most recent passwords
        const updatedHistory = [newPasswordHash, ...passwordHistory];
        return updatedHistory.slice(0, PASSWORD_HISTORY_SIZE);
    }

    static generateTemporaryPassword(): string {
        return cryptoGenerateSecurePassword(16);
    }
}
