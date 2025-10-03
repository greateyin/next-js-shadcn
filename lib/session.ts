import { db } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Metadata for a user session
 */
export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  lastActivity?: Date;
}

/**
 * Create a new session for a user
 * @param userId - The user's ID
 * @param metadata - Session metadata
 * @returns The created session
 */
export async function createSession(userId: string, metadata: SessionMetadata) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return await db.session.create({
    data: {
      userId,
      sessionToken,
      expires,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      lastActivity: metadata.lastActivity || new Date(),
    },
  });
}

/**
 * Get a session by token
 * @param sessionToken - The session token
 * @returns The session if found and not expired, null otherwise
 */
export async function getSessionByToken(sessionToken: string) {
  const session = await db.session.findUnique({
    where: { 
      sessionToken,
      expires: { gt: new Date() }
    },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  return session;
}

/**
 * Update a session's last activity
 * @param sessionToken - The session token
 * @returns The updated session
 */
export async function updateSessionActivity(sessionToken: string) {
  return await db.session.update({
    where: { sessionToken },
    data: { lastActivity: new Date() },
  });
}

/**
 * Delete a session
 * @param sessionToken - The session token
 */
export async function deleteSession(sessionToken: string) {
  await db.session.delete({
    where: { sessionToken },
  });
}

/**
 * Get all sessions for a user
 * @param userId - The user's ID
 * @returns The user's sessions
 */
export async function getUserSessions(userId: string) {
  return await db.session.findMany({
    where: { 
      userId,
      expires: { gt: new Date() }
    },
    orderBy: { lastActivity: "desc" },
  });
}

/**
 * Delete all sessions for a user except the current one
 * @param userId - The user's ID
 * @param currentSessionToken - The current session token to keep
 */
export async function deleteOtherSessions(userId: string, currentSessionToken: string) {
  await db.session.deleteMany({
    where: {
      userId,
      NOT: { sessionToken: currentSessionToken },
    },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  await db.session.deleteMany({
    where: {
      OR: [
        { expires: { lt: new Date() } },
        { lastActivity: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // 7 days inactive
      ],
    },
  });
}