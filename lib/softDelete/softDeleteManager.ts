import { db } from "@/lib/db";

/**
 * Soft delete a user
 * Marks user as deleted without removing data
 * 
 * @param userId - User ID to soft delete
 * @returns Updated user with deletedAt timestamp
 */
export async function softDeleteUser(userId: string) {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date()
      }
    });

    console.log(`[SoftDelete] User ${userId} soft deleted`);
    return user;
  } catch (error) {
    console.error('[SoftDelete] Error soft deleting user:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted user
 * 
 * @param userId - User ID to restore
 * @returns Updated user with deletedAt set to null
 */
export async function restoreUser(userId: string) {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: null
      }
    });

    console.log(`[SoftDelete] User ${userId} restored`);
    return user;
  } catch (error) {
    console.error('[SoftDelete] Error restoring user:', error);
    throw error;
  }
}

/**
 * Soft delete a role
 * 
 * @param roleId - Role ID to soft delete
 * @returns Updated role with deletedAt timestamp
 */
export async function softDeleteRole(roleId: string) {
  try {
    const role = await db.role.update({
      where: { id: roleId },
      data: {
        deletedAt: new Date()
      }
    });

    console.log(`[SoftDelete] Role ${roleId} soft deleted`);
    return role;
  } catch (error) {
    console.error('[SoftDelete] Error soft deleting role:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted role
 * 
 * @param roleId - Role ID to restore
 * @returns Updated role with deletedAt set to null
 */
export async function restoreRole(roleId: string) {
  try {
    const role = await db.role.update({
      where: { id: roleId },
      data: {
        deletedAt: null
      }
    });

    console.log(`[SoftDelete] Role ${roleId} restored`);
    return role;
  } catch (error) {
    console.error('[SoftDelete] Error restoring role:', error);
    throw error;
  }
}

/**
 * Soft delete a menu item
 * 
 * @param menuItemId - Menu item ID to soft delete
 * @returns Updated menu item with deletedAt timestamp
 */
export async function softDeleteMenuItem(menuItemId: string) {
  try {
    const menuItem = await db.menuItem.update({
      where: { id: menuItemId },
      data: {
        deletedAt: new Date()
      }
    });

    console.log(`[SoftDelete] Menu item ${menuItemId} soft deleted`);
    return menuItem;
  } catch (error) {
    console.error('[SoftDelete] Error soft deleting menu item:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted menu item
 * 
 * @param menuItemId - Menu item ID to restore
 * @returns Updated menu item with deletedAt set to null
 */
export async function restoreMenuItem(menuItemId: string) {
  try {
    const menuItem = await db.menuItem.update({
      where: { id: menuItemId },
      data: {
        deletedAt: null
      }
    });

    console.log(`[SoftDelete] Menu item ${menuItemId} restored`);
    return menuItem;
  } catch (error) {
    console.error('[SoftDelete] Error restoring menu item:', error);
    throw error;
  }
}

/**
 * Get soft-deleted users
 * 
 * @param limit - Number of records to return
 * @returns Array of soft-deleted users
 */
export async function getSoftDeletedUsers(limit: number = 50) {
  try {
    return db.user.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      orderBy: { deletedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true
      }
    });
  } catch (error) {
    console.error('[SoftDelete] Error getting soft-deleted users:', error);
    return [];
  }
}

/**
 * Get soft-deleted roles
 * 
 * @param limit - Number of records to return
 * @returns Array of soft-deleted roles
 */
export async function getSoftDeletedRoles(limit: number = 50) {
  try {
    return db.role.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      orderBy: { deletedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        deletedAt: true
      }
    });
  } catch (error) {
    console.error('[SoftDelete] Error getting soft-deleted roles:', error);
    return [];
  }
}

/**
 * Get soft-deleted menu items
 * 
 * @param applicationId - Application ID (optional)
 * @param limit - Number of records to return
 * @returns Array of soft-deleted menu items
 */
export async function getSoftDeletedMenuItems(
  applicationId?: string,
  limit: number = 50
) {
  try {
    return db.menuItem.findMany({
      where: {
        deletedAt: {
          not: null
        },
        ...(applicationId && { applicationId })
      },
      orderBy: { deletedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        displayName: true,
        path: true,
        applicationId: true,
        deletedAt: true
      }
    });
  } catch (error) {
    console.error('[SoftDelete] Error getting soft-deleted menu items:', error);
    return [];
  }
}

/**
 * Permanently delete soft-deleted records older than specified days
 * Use with caution - this is irreversible
 * 
 * @param daysOld - Delete records older than this many days
 * @returns Object with counts of deleted records
 */
export async function permanentlyDeleteOldSoftDeletedRecords(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [deletedUsers, deletedRoles, deletedMenuItems] = await Promise.all([
      db.user.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate
          }
        }
      }),
      db.role.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate
          }
        }
      }),
      db.menuItem.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate
          }
        }
      })
    ]);

    console.warn(
      `[SoftDelete] Permanently deleted: ${deletedUsers.count} users, ` +
      `${deletedRoles.count} roles, ${deletedMenuItems.count} menu items`
    );

    return {
      deletedUsers: deletedUsers.count,
      deletedRoles: deletedRoles.count,
      deletedMenuItems: deletedMenuItems.count
    };
  } catch (error) {
    console.error('[SoftDelete] Error permanently deleting old records:', error);
    throw error;
  }
}

/**
 * Get soft delete statistics
 * 
 * @returns Statistics about soft-deleted records
 */
export async function getSoftDeleteStats() {
  try {
    const [deletedUsers, deletedRoles, deletedMenuItems] = await Promise.all([
      db.user.count({
        where: { deletedAt: { not: null } }
      }),
      db.role.count({
        where: { deletedAt: { not: null } }
      }),
      db.menuItem.count({
        where: { deletedAt: { not: null } }
      })
    ]);

    return {
      deletedUsers,
      deletedRoles,
      deletedMenuItems,
      total: deletedUsers + deletedRoles + deletedMenuItems
    };
  } catch (error) {
    console.error('[SoftDelete] Error getting soft delete stats:', error);
    return {
      deletedUsers: 0,
      deletedRoles: 0,
      deletedMenuItems: 0,
      total: 0
    };
  }
}

