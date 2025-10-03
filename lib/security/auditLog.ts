import { db } from '@/lib/db';
import { logger } from '@/lib/serverLogger';

export enum AuditAction {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    REGISTER = 'REGISTER',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    PASSWORD_RESET = 'PASSWORD_RESET',
    PROFILE_UPDATE = 'PROFILE_UPDATE',
    TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
    TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',
    SESSION_CREATE = 'SESSION_CREATE',
    SESSION_DESTROY = 'SESSION_DESTROY',
    ADMIN_ACTION = 'ADMIN_ACTION',
    DATA_ACCESS = 'DATA_ACCESS',
    DATA_MODIFY = 'DATA_MODIFY',
    PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

export enum AuditStatus {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    ATTEMPT = 'ATTEMPT',
    WARNING = 'WARNING',
}

interface AuditMetadata {
    ipAddress?: string;
    userAgent?: string;
    targetUserId?: string;
    resourceId?: string;
    resourceType?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    [key: string]: any;
}

export class AuditLogger {
    static async log(
        userId: string | null,
        action: AuditAction,
        status: AuditStatus,
        metadata: AuditMetadata = {}
    ): Promise<void> {
        try {
            const {
                ipAddress,
                userAgent,
                targetUserId,
                resourceId,
                resourceType,
                oldValue,
                newValue,
                reason,
                ...additionalMetadata
            } = metadata;

            await db.auditLog.create({
                data: {
                    userId,
                    action,
                    status,
                    ipAddress,
                    userAgent,
                    targetUserId,
                    resourceId,
                    resourceType,
                    oldValue,
                    newValue,
                    reason,
                    metadata: additionalMetadata,
                    timestamp: new Date(),
                }
            });

            // Also log to application logger for monitoring
            logger.info('Audit event recorded', {
                userId,
                action,
                status,
                metadata,
            });
        } catch (error) {
            logger.error('Error recording audit log', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                action,
                status,
            });
            throw new Error('Failed to record audit log');
        }
    }

    static async searchLogs(params: {
        userId?: string;
        action?: AuditAction;
        status?: AuditStatus;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<any[]> {
        try {
            const {
                userId,
                action,
                status,
                startDate,
                endDate,
                limit = 50,
                offset = 0,
            } = params;

            const where: any = {};

            if (userId) where.userId = userId;
            if (action) where.action = action;
            if (status) where.status = status;
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate) where.timestamp.gte = startDate;
                if (endDate) where.timestamp.lte = endDate;
            }

            const logs = await db.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: offset,
            });

            return logs;
        } catch (error) {
            logger.error('Error searching audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                params,
            });
            throw new Error('Failed to search audit logs');
        }
    }

    static async getAuditSummary(params: {
        startDate: Date;
        endDate: Date;
    }): Promise<any> {
        try {
            const { startDate, endDate } = params;

            const summary = await db.auditLog.groupBy({
                by: ['action', 'status'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _count: true,
            });

            return summary;
        } catch (error) {
            logger.error('Error generating audit summary', {
                error: error instanceof Error ? error.message : 'Unknown error',
                params,
            });
            throw new Error('Failed to generate audit summary');
        }
    }

    static async cleanupOldLogs(retentionDays: number): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            await db.auditLog.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate,
                    },
                },
            });

            logger.info('Old audit logs cleaned up', {
                retentionDays,
                cutoffDate,
            });
        } catch (error) {
            logger.error('Error cleaning up old audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                retentionDays,
            });
            throw new Error('Failed to clean up old audit logs');
        }
    }
}
