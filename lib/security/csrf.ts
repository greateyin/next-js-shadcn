import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { logger } from '@/lib/serverLogger';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class CSRFProtection {
    static generateToken(): string {
        return randomBytes(TOKEN_LENGTH).toString('hex');
    }

    static async setToken(): Promise<string> {
        const token = this.generateToken();
        const cookieStore = await cookies();
        
        cookieStore.set(CSRF_TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: TOKEN_TTL / 1000, // Convert to seconds
        });

        return token;
    }

    static async validateToken(request: Request): Promise<boolean> {
        try {
            const cookieStore = await cookies();
            const storedToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
            const requestToken = request.headers.get(CSRF_HEADER);

            if (!storedToken || !requestToken) {
                logger.warn('CSRF token missing', {
                    hasStoredToken: !!storedToken,
                    hasRequestToken: !!requestToken,
                });
                return false;
            }

            const isValid = storedToken === requestToken;
            if (!isValid) {
                logger.warn('CSRF token mismatch', {
                    tokenLength: requestToken.length,
                });
            }

            return isValid;
        } catch (error) {
            logger.error('CSRF validation error', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    static async clearToken() {
        const cookieStore = await cookies();
        cookieStore.delete(CSRF_TOKEN_COOKIE);
    }
}

// Middleware to validate CSRF token
export async function validateCSRF(request: Request): Promise<Response | null> {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase());
    if (safeMethod) {
        return null;
    }

    const isValid = await CSRFProtection.validateToken(request);
    if (!isValid) {
        return new Response(
            JSON.stringify({ error: 'Invalid CSRF token' }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    return null;
}
