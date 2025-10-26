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
    const [
      totalUsers,
      totalRoles,
      totalApplications,
      userSessions,
      userPermissions,
      recentActivities
    ] = await Promise.all([
      // Total users count
      db.user.count({
        where: { status: 'active' }
      }),
      
      // Total roles count
      db.role.count(),
      
      // Total applications count
      db.application.count({
        where: { isActive: true }
      }),
      
      // User's sessions count
      db.session.count({
        where: { userId: session.user.id }
      }),
      
      // User's permissions count
      db.userRole.findMany({
        where: { userId: session.user.id },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      }),
      
      // Recent audit logs for user
      db.auditLog.findMany({
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
      })
    ])

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

