import { db } from "@/lib/db";

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

export async function createAuditLog(options: AuditLogOptions) {
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
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      timestamp: new Date(),
    },
  });
}

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