import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { logger } from '@/lib/serverLogger';

// Session configuration
const SESSION_COOKIE = 'session_id';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface SessionData {
    sessionToken: string;
    userId: string;
    expires: Date;
    lastActivity: Date;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class SessionManager {
    static async createSession(
        userId: string,
        request: Request
    ): Promise<{ sessionId: string; token: string }> {
        try {
            const sessionId = nanoid();
            const expiresAt = new Date(Date.now() + SESSION_DURATION);
            
            // Create session record
            await db.session.create({
                data: {
                    sessionToken: sessionId,
                    userId,
                    expires: expiresAt,
                    lastActivity: new Date(),
                    userAgent: request.headers.get('user-agent') || null,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null,
                }
            });

            // Generate session token
            const token = await this.generateToken(sessionId, userId);

            // Set session cookie
            const cookieStore = await cookies();
            cookieStore.set(SESSION_COOKIE, sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: SESSION_DURATION / 1000,
            });

            return { sessionId, token };
        } catch (error) {
            logger.error('Error creating session', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            throw new Error('Failed to create session');
        }
    }

    static async validateSession(sessionId: string): Promise<SessionData | null> {
        try {
            const session = await db.session.findUnique({
                where: { sessionToken: sessionId }
            });

            if (!session) {
                return null;
            }

            // Check if session has expired
            if (new Date() > session.expires) {
                await this.destroySession(sessionId);
                return null;
            }

            // Check for inactivity timeout
            const inactiveTime = Date.now() - session.lastActivity.getTime();
            if (inactiveTime > INACTIVE_TIMEOUT) {
                await this.destroySession(sessionId);
                return null;
            }

            // Update last activity
            await db.session.update({
                where: { sessionToken: sessionId },
                data: { lastActivity: new Date() }
            });

            return session;
        } catch (error) {
            logger.error('Error validating session', {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId,
            });
            return null;
        }
    }

    static async refreshSession(sessionId: string): Promise<string | null> {
        try {
            const session = await this.validateSession(sessionId);
            if (!session) {
                return null;
            }

            // Generate new token
            return await this.generateToken(sessionId, session.userId);
        } catch (error) {
            logger.error('Error refreshing session', {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId,
            });
            return null;
        }
    }

    static async destroySession(sessionId: string): Promise<void> {
        try {
            // Delete session from database
            await db.session.delete({
                where: { sessionToken: sessionId }
            });

            // Clear session cookie
            const cookieStore = await cookies();
            cookieStore.delete(SESSION_COOKIE);

            logger.info('Session destroyed', { sessionId });
        } catch (error) {
            logger.error('Error destroying session', {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId,
            });
            throw new Error('Failed to destroy session');
        }
    }

    static async destroyAllUserSessions(userId: string): Promise<void> {
        try {
            await db.session.deleteMany({
                where: { userId }
            });
        } catch (error) {
            logger.error('Error destroying user sessions', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            throw new Error('Failed to destroy user sessions');
        }
    }

    private static async generateToken(sessionId: string, userId: string): Promise<string> {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
        
        return await new SignJWT({ sessionId, userId })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .setJti(nanoid())
            .sign(secretKey);
    }

    static async cleanupExpiredSessions(): Promise<void> {
        try {
            await db.session.deleteMany({
                where: {
                    OR: [
                        { expires: { lt: new Date() } },
                        { lastActivity: { lt: new Date(Date.now() - INACTIVE_TIMEOUT) } }
                    ]
                }
            });
        } catch (error) {
            logger.error('Error cleaning up expired sessions', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
