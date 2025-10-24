import { db } from "@/lib/db";
import { permissionCache } from "@/lib/auth/permissionCache";
import { UserWithRoles } from "@/types/roles";

/**
 * Preload permissions for a user on application startup
 * Reduces first-time permission check latency
 * 
 * @param userId - User ID to preload permissions for
 * @returns Preloaded user permissions
 */
export async function preloadUserPermissions(userId: string): Promise<UserWithRoles | null> {
  try {
    const startTime = performance.now();

    // Get user with all related data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                },
                applications: {
                  include: {
                    application: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // Extract and deduplicate data
    const roles = user.userRoles.map(ur => ur.role);
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => rp.permission)
    );
    const applications = user.userRoles.flatMap(ur =>
      ur.role.applications
        .filter(ra => ra.application.isActive)
        .map(ra => ra.application)
    );

    const uniquePermissions = Array.from(
      new Map(permissions.map(p => [p.id, p])).values()
    );
    const uniqueApplications = Array.from(
      new Map(applications.map(a => [a.id, a])).values()
    );

    const result: UserWithRoles = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      roles,
      permissions: uniquePermissions,
      applications: uniqueApplications
    };

    // Store in cache
    permissionCache.set(userId, result);

    const executionTime = performance.now() - startTime;
    console.log(
      `[PermissionPreloader] Preloaded permissions for user ${userId} in ${executionTime.toFixed(2)}ms`
    );

    return result;
  } catch (error) {
    console.error('[PermissionPreloader] Error preloading permissions:', error);
    return null;
  }
}

/**
 * Preload permissions for multiple users
 * Useful for batch operations or warming up cache
 * 
 * @param userIds - Array of user IDs
 * @returns Map of user ID to preloaded permissions
 */
export async function preloadMultipleUserPermissions(
  userIds: string[]
): Promise<Map<string, UserWithRoles>> {
  try {
    const startTime = performance.now();
    const results = new Map<string, UserWithRoles>();

    // Preload in parallel
    const promises = userIds.map(userId => preloadUserPermissions(userId));
    const preloadedData = await Promise.all(promises);

    preloadedData.forEach((data, index) => {
      if (data) {
        results.set(userIds[index], data);
      }
    });

    const executionTime = performance.now() - startTime;
    console.log(
      `[PermissionPreloader] Preloaded permissions for ${results.size}/${userIds.length} users in ${executionTime.toFixed(2)}ms`
    );

    return results;
  } catch (error) {
    console.error('[PermissionPreloader] Error preloading multiple users:', error);
    return new Map();
  }
}

/**
 * Preload all active users' permissions
 * Use with caution - can be resource intensive
 * 
 * @param limit - Maximum number of users to preload
 * @returns Number of users preloaded
 */
export async function preloadAllActiveUsersPermissions(limit: number = 1000): Promise<number> {
  try {
    const startTime = performance.now();

    // Get all active users
    const users = await db.user.findMany({
      where: {
        status: 'active',
        deletedAt: null
      },
      select: { id: true },
      take: limit
    });

    const userIds = users.map(u => u.id);

    // Preload in batches to avoid overwhelming the system
    const batchSize = 100;
    let preloadedCount = 0;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await preloadMultipleUserPermissions(batch);
      preloadedCount += results.size;
    }

    const executionTime = performance.now() - startTime;
    console.log(
      `[PermissionPreloader] Preloaded permissions for ${preloadedCount} active users in ${executionTime.toFixed(2)}ms`
    );

    return preloadedCount;
  } catch (error) {
    console.error('[PermissionPreloader] Error preloading all users:', error);
    return 0;
  }
}

/**
 * Preload permissions for users with specific role
 * 
 * @param roleName - Role name
 * @returns Number of users preloaded
 */
export async function preloadPermissionsByRole(roleName: string): Promise<number> {
  try {
    const startTime = performance.now();

    // Get users with specific role
    const userRoles = await db.userRole.findMany({
      where: {
        role: {
          name: roleName
        }
      },
      select: { userId: true }
    });

    const userIds = userRoles.map(ur => ur.userId);
    const results = await preloadMultipleUserPermissions(userIds);

    const executionTime = performance.now() - startTime;
    console.log(
      `[PermissionPreloader] Preloaded permissions for ${results.size} users with role "${roleName}" in ${executionTime.toFixed(2)}ms`
    );

    return results.size;
  } catch (error) {
    console.error('[PermissionPreloader] Error preloading by role:', error);
    return 0;
  }
}

/**
 * Preload permissions for users with specific application access
 * 
 * @param applicationId - Application ID
 * @returns Number of users preloaded
 */
export async function preloadPermissionsByApplication(applicationId: string): Promise<number> {
  try {
    const startTime = performance.now();

    // Get users with access to specific application
    const roleApps = await db.roleApplication.findMany({
      where: { applicationId },
      select: {
        role: {
          select: {
            users: {
              select: { userId: true }
            }
          }
        }
      }
    });

    const userIds = Array.from(
      new Set(
        roleApps.flatMap(ra =>
          ra.role.users.map(u => u.userId)
        )
      )
    );

    const results = await preloadMultipleUserPermissions(userIds);

    const executionTime = performance.now() - startTime;
    console.log(
      `[PermissionPreloader] Preloaded permissions for ${results.size} users with application access in ${executionTime.toFixed(2)}ms`
    );

    return results.size;
  } catch (error) {
    console.error('[PermissionPreloader] Error preloading by application:', error);
    return 0;
  }
}

/**
 * Get preload statistics
 * 
 * @returns Statistics about preloaded permissions
 */
export async function getPreloadStats() {
  try {
    const cacheStats = {
      // Cache stats would come from permissionCache if it exposes them
      message: 'Use permissionCache.getStats() for detailed cache statistics'
    };

    return {
      cacheStats,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[PermissionPreloader] Error getting preload stats:', error);
    return null;
  }
}

/**
 * Warm up cache for frequently accessed users
 * Call this during application startup
 * 
 * @returns Number of users preloaded
 */
export async function warmUpPermissionCache(): Promise<number> {
  try {
    console.log('[PermissionPreloader] Starting cache warm-up...');

    // Preload admin users first (usually fewer)
    const adminCount = await preloadPermissionsByRole('admin');

    // Then preload other active users
    const totalCount = await preloadAllActiveUsersPermissions(500);

    console.log(
      `[PermissionPreloader] Cache warm-up complete: ${adminCount} admins, ${totalCount} total users`
    );

    return totalCount;
  } catch (error) {
    console.error('[PermissionPreloader] Error warming up cache:', error);
    return 0;
  }
}

