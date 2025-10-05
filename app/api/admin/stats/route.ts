import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/stats
 * 获取管理后台统计数据
 */
export async function GET() {
  try {
    const session = await auth();

    // 检查是否登录
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查是否有管理员权限
    const isAdmin = session.user.role === "admin" || 
                    session.user.roleNames?.includes("admin") ||
                    session.user.roleNames?.includes("super-admin");
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // 并行获取所有统计数据
    const [
      // 用户统计
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      usersWithTwoFactor,
      
      // 角色统计
      totalRoles,
      
      // 应用统计
      totalApplications,
      activeApplications,
      
      // 菜单统计
      totalMenuItems,
      visibleMenuItems,
      disabledMenuItems,
      
      // 会话统计
      activeSessions,
      todaySessions,
      
      // 权限统计
      totalPermissions,
      
      // 审计日志统计（最近 24 小时）
      recentAuditLogs,
      failedOperations,
      criticalLogs,
      
      // 最近 7 天的用户增长
      last7DaysUsers,
      
      // 按状态分组的用户数
      usersByStatus,
    ] = await Promise.all([
      // 用户统计
      db.user.count(),
      db.user.count({ where: { status: "active" } }),
      db.user.count({ where: { status: "pending" } }),
      db.user.count({ where: { status: "suspended" } }),
      db.user.count({ where: { isTwoFactorEnabled: true } }),
      
      // 角色统计
      db.role.count(),
      
      // 应用统计
      db.application.count(),
      db.application.count({ where: { isActive: true } }),
      
      // 菜单统计
      db.menuItem.count(),
      db.menuItem.count({ where: { isVisible: true } }),
      db.menuItem.count({ where: { isDisabled: true } }),
      
      // 会话统计（未过期的会话）
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
      
      // 权限统计
      db.permission.count(),
      
      // 审计日志统计（最近 24 小时）
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
      
      // 最近 7 天的用户增长
      db.user.groupBy({
        by: ["createdAt"],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // 按状态分组的用户数
      db.user.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    // 计算用户增长趋势（相对于上个月）
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

    // 计算会话增长趋势
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

    // 处理按状态分组的数据
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
