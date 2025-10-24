import { db } from "@/lib/db";
import { headers } from "next/headers";

export interface AuditLogOptions {
  userId?: string;
  action: string;
  status: string;
  targetUserId?: string;
  resourceId?: string;
  resourceType?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get client IP address from request headers
 */
function getClientIp(): string | undefined {
  try {
    const headersList = headers();
    return (
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      undefined
    );
  } catch {
    return undefined;
  }
}

/**
 * Get user agent from request headers
 */
function getUserAgent(): string | undefined {
  try {
    const headersList = headers();
    return headersList.get('user-agent') || undefined;
  } catch {
    return undefined;
  }
}

export async function createAuditLog(options: AuditLogOptions) {
  const ipAddress = options.ipAddress || getClientIp();
  const userAgent = options.userAgent || getUserAgent();

  return await db.auditLog.create({
    data: {
      userId: options.userId,
      action: options.action,
      status: options.status,
      targetUserId: options.targetUserId,
      resourceId: options.resourceId,
      resourceType: options.resourceType,
      oldValue: options.oldValue,
      newValue: options.newValue,
      reason: options.reason,
      metadata: options.metadata,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: new Date(),
    },
  });
}

/**
 * Convenience function for successful operations
 */
export async function logAuditSuccess(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  newValue?: any
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resourceType,
    resourceId,
    newValue: newValue ? JSON.stringify(newValue) : undefined,
    status: 'SUCCESS'
  });
}

/**
 * Convenience function for failed operations
 */
export async function logAuditFailure(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  error: string,
  oldValue?: any
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resourceType,
    resourceId,
    oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
    status: 'FAILED',
    reason: error
  });
}

/**
 * Audit logger utility
 */
export const auditLogger = {
  log: createAuditLog,
  success: logAuditSuccess,
  failure: logAuditFailure,
};

export async function queryAuditLogs(filters: {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  return await db.auditLog.findMany({
    where: {
      userId: filters.userId,
      action: filters.action,
      status: filters.status,
      timestamp: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });
}