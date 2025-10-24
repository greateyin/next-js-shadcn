import { db } from "@/lib/db";

/**
 * Menu version info
 */
export interface MenuVersionInfo {
  applicationId: string;
  currentVersion: number;
  lastUpdated: Date;
}

/**
 * Get the current version of menu for an application
 * Used by frontend to detect if menu cache is stale
 * 
 * @param applicationId - Application ID
 * @returns Current menu version
 */
export async function getMenuVersion(applicationId: string): Promise<number> {
  try {
    const latest = await db.menuItem.findFirst({
      where: { applicationId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    return latest?.version ?? 0;
  } catch (error) {
    console.error('[MenuVersion] Error getting menu version:', error);
    return 0;
  }
}

/**
 * Get version info for multiple applications
 * 
 * @param applicationIds - Array of application IDs
 * @returns Map of application ID to version
 */
export async function getMenuVersions(
  applicationIds: string[]
): Promise<Map<string, number>> {
  try {
    const versions = new Map<string, number>();

    for (const appId of applicationIds) {
      const version = await getMenuVersion(appId);
      versions.set(appId, version);
    }

    return versions;
  } catch (error) {
    console.error('[MenuVersion] Error getting menu versions:', error);
    return new Map();
  }
}

/**
 * Get detailed version info for an application
 * 
 * @param applicationId - Application ID
 * @returns MenuVersionInfo with version and last update time
 */
export async function getMenuVersionInfo(
  applicationId: string
): Promise<MenuVersionInfo | null> {
  try {
    const latest = await db.menuItem.findFirst({
      where: { applicationId },
      orderBy: { updatedAt: 'desc' },
      select: { version: true, updatedAt: true }
    });

    if (!latest) {
      return null;
    }

    return {
      applicationId,
      currentVersion: latest.version,
      lastUpdated: latest.updatedAt
    };
  } catch (error) {
    console.error('[MenuVersion] Error getting menu version info:', error);
    return null;
  }
}

/**
 * Increment version for a menu item
 * Called automatically when menu item is updated
 * 
 * @param menuItemId - Menu item ID
 * @returns Updated menu item with new version
 */
export async function incrementMenuItemVersion(menuItemId: string) {
  try {
    const current = await db.menuItem.findUnique({
      where: { id: menuItemId },
      select: { version: true }
    });

    if (!current) {
      throw new Error(`Menu item ${menuItemId} not found`);
    }

    return db.menuItem.update({
      where: { id: menuItemId },
      data: {
        version: current.version + 1
      }
    });
  } catch (error) {
    console.error('[MenuVersion] Error incrementing menu item version:', error);
    throw error;
  }
}

/**
 * Increment version for all menu items in an application
 * Called when application-level changes occur
 * 
 * @param applicationId - Application ID
 * @returns Number of items updated
 */
export async function incrementApplicationMenuVersion(
  applicationId: string
): Promise<number> {
  try {
    const result = await db.menuItem.updateMany({
      where: { applicationId },
      data: {
        version: {
          increment: 1
        }
      }
    });

    console.log(
      `[MenuVersion] Incremented version for ${result.count} menu items in application ${applicationId}`
    );

    return result.count;
  } catch (error) {
    console.error('[MenuVersion] Error incrementing application menu version:', error);
    throw error;
  }
}

/**
 * Check if menu version has changed since last check
 * Useful for detecting stale client-side caches
 * 
 * @param applicationId - Application ID
 * @param lastKnownVersion - Last known version on client
 * @returns true if version has changed, false otherwise
 */
export async function hasMenuVersionChanged(
  applicationId: string,
  lastKnownVersion: number
): Promise<boolean> {
  try {
    const currentVersion = await getMenuVersion(applicationId);
    return currentVersion > lastKnownVersion;
  } catch (error) {
    console.error('[MenuVersion] Error checking menu version change:', error);
    return false;
  }
}

/**
 * Get menu items that have been updated since a specific version
 * Useful for incremental updates
 * 
 * @param applicationId - Application ID
 * @param sinceVersion - Version to check since
 * @returns Array of updated menu items
 */
export async function getMenuItemsUpdatedSinceVersion(
  applicationId: string,
  sinceVersion: number
) {
  try {
    return db.menuItem.findMany({
      where: {
        applicationId,
        version: {
          gt: sinceVersion
        }
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        path: true,
        version: true,
        updatedAt: true
      }
    });
  } catch (error) {
    console.error('[MenuVersion] Error getting updated menu items:', error);
    return [];
  }
}

/**
 * Reset menu version for an application
 * Use with caution - forces all clients to refresh
 * 
 * @param applicationId - Application ID
 * @returns Number of items updated
 */
export async function resetMenuVersion(applicationId: string): Promise<number> {
  try {
    const result = await db.menuItem.updateMany({
      where: { applicationId },
      data: { version: 0 }
    });

    console.warn(
      `[MenuVersion] Reset menu version for ${result.count} items in application ${applicationId}`
    );

    return result.count;
  } catch (error) {
    console.error('[MenuVersion] Error resetting menu version:', error);
    throw error;
  }
}

/**
 * Get version statistics for an application
 * 
 * @param applicationId - Application ID
 * @returns Statistics about menu versions
 */
export async function getMenuVersionStats(applicationId: string) {
  try {
    const items = await db.menuItem.findMany({
      where: { applicationId },
      select: { version: true }
    });

    if (items.length === 0) {
      return {
        applicationId,
        totalItems: 0,
        maxVersion: 0,
        avgVersion: 0,
        minVersion: 0
      };
    }

    const versions = items.map(i => i.version);
    const maxVersion = Math.max(...versions);
    const minVersion = Math.min(...versions);
    const avgVersion = versions.reduce((a, b) => a + b, 0) / versions.length;

    return {
      applicationId,
      totalItems: items.length,
      maxVersion,
      minVersion,
      avgVersion: Math.round(avgVersion * 100) / 100
    };
  } catch (error) {
    console.error('[MenuVersion] Error getting menu version stats:', error);
    return null;
  }
}

