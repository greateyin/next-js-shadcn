import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
export async function GET() {
  try {
    const session = await auth();

    // Check if logged in
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if has administrator permissions
    // ⚠️ SECURITY: Only check roleNames array (from UserRole join table)
    // Do NOT fall back to user.role - it doesn't exist in the database
    const isAdmin = session.user.roleNames?.includes("admin") ||
                    session.user.roleNames?.includes("super-admin");
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch all statistics in parallel
    const [
      // User statistics
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      usersWithTwoFactor,
      
      // Role statistics
      totalRoles,
      
      // Application statistics
      totalApplications,
      activeApplications,
      
      // Menu statistics
      totalMenuItems,
      visibleMenuItems,
      disabledMenuItems,
      
      // Session statistics
      activeSessions,
      todaySessions,
      
      // Permission statistics
      totalPermissions,
      
      // Audit log statistics (last 24 hours)
      recentAuditLogs,
      failedOperations,
      criticalLogs,
      
      // User growth in the last 7 days
      last7DaysUsers,
      
      // User count grouped by status
      usersByStatus,
    ] = await Promise.all([
      // User statistics
      db.user.count(),
      db.user.count({ where: { status: "active" } }),
      db.user.count({ where: { status: "pending" } }),
      db.user.count({ where: { status: "suspended" } }),
      db.user.count({ where: { isTwoFactorEnabled: true } }),
      
      // Role statistics
      db.role.count(),
      
      // Application statistics
      db.application.count(),
      db.application.count({ where: { isActive: true } }),
      
      // Menu statistics
      db.menuItem.count(),
      db.menuItem.count({ where: { isVisible: true } }),
      db.menuItem.count({ where: { isDisabled: true } }),
      
      // Session statistics (unexpired sessions)
      db.session.count({
        where: {
          expires: {
            gt: new Date(),
          },
        },
      }),
      db.session.count({
        where: {
          expires: {
            gt: new Date(),
          },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      
      // Permission statistics
      db.permission.count(),
      
      // Audit log statistics (last 24 hours)
      db.auditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.auditLog.count({
        where: {
          status: "FAILED",
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.auditLog.count({
        where: {
          priority: "critical",
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // User growth in last 7 days
      db.user.groupBy({
        by: ["createdAt"],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // User count grouped by status
      db.user.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    // Calculate user growth trend (relative to last month)
    const lastMonthUsers = await db.user.count({
      where: {
        createdAt: {
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });
    
    const userGrowthPercentage = lastMonthUsers > 0 
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : "0";

    // Calculate session growth trend
    const yesterdaySessions = await db.session.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1)),
          lt: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    
    const sessionGrowthPercentage = yesterdaySessions > 0
      ? ((todaySessions - yesterdaySessions) / yesterdaySessions * 100).toFixed(1)
      : "0";

    // Process grouped by status data
    const statusDistribution = usersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
        withTwoFactor: usersWithTwoFactor,
        growthPercentage: userGrowthPercentage,
        byStatus: statusDistribution,
      },
      roles: {
        total: totalRoles,
      },
      applications: {
        total: totalApplications,
        active: activeApplications,
        inactive: totalApplications - activeApplications,
      },
      menuItems: {
        total: totalMenuItems,
        visible: visibleMenuItems,
        disabled: disabledMenuItems,
      },
      sessions: {
        active: activeSessions,
        today: todaySessions,
        growthPercentage: sessionGrowthPercentage,
      },
      permissions: {
        total: totalPermissions,
      },
      auditLogs: {
        recent: recentAuditLogs,
        failed24h: failedOperations,
        critical24h: criticalLogs,
      },
      systemHealth: {
        status: "operational",
        percentage: 100,
        message: "All systems operational",
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
