/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the current user
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's statistics
    let totalUsers, totalRoles, totalApplications, userSessions, userPermissions, recentActivities;

    try {
      totalUsers = await db.user.count({
        where: { status: 'active' }
      });
    } catch (error) {
      console.error('[API_DASHBOARD_STATS] Error counting users:', error);
      totalUsers = 0;
    }

    try {
      totalRoles = await db.role.count();
    } catch (error) {
      console.error('[API_DASHBOARD_STATS] Error counting roles:', error);
      totalRoles = 0;
    }

    try {
      totalApplications = await db.application.count({
        where: { isActive: true }
      });
    } catch (error) {
      console.error('[API_DASHBOARD_STATS] Error counting applications:', error);
      totalApplications = 0;
    }

    try {
      userSessions = await db.session.count({
        where: { userId: session.user.id }
      });
    } catch (error) {
      console.error('[API_DASHBOARD_STATS] Error counting sessions:', error);
      userSessions = 0;
    }

    try {
      userPermissions = await db.userRole.findMany({
        where: { userId: session.user.id },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      });
    } catch (error) {
      console.error('[API_DASHBOARD_STATS] Error fetching user permissions:', error);
      userPermissions = [];
    }

    try {
      recentActivities = await db.auditLog.findMany({
        where: { userId: session.user.id },
        orderBy: { timestamp: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          timestamp: true,
          status: true
        }
      });
    } catch (error) {
      console.error('[API_DASHBOARD_STATS] Error fetching recent activities:', error);
      recentActivities = [];
    }

    // Calculate total permissions
    const totalPermissions = new Set(
      userPermissions.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permissionId)
      )
    ).size

    // Calculate growth metrics (mock data for now)
    const stats = {
      users: {
        total: totalUsers,
        growth: '+12.5%',
        description: 'Active users in system'
      },
      roles: {
        total: totalRoles,
        growth: '+2.3%',
        description: 'Total roles available'
      },
      applications: {
        total: totalApplications,
        growth: '+5.1%',
        description: 'Active applications'
      },
      sessions: {
        total: userSessions,
        growth: '+8.2%',
        description: 'Your active sessions'
      },
      permissions: {
        total: totalPermissions,
        growth: '+3.7%',
        description: 'Your permissions'
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        entity: activity.resourceType || 'Unknown',
        entityId: activity.resourceId || '',
        timestamp: activity.timestamp.toISOString(),
        status: activity.status
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[API_DASHBOARD_STATS]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

