/**
 * @fileoverview Menu Item Query Functions
 * @module lib/menu
 * @description Functions for querying menu items based on user roles
 */

import { db } from "@/lib/db";
import { MenuItemType } from "@prisma/client";

/**
 * MenuItem with children type
 */
export interface MenuItemWithChildren {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  path: string;
  icon: string | null;
  type: MenuItemType;
  order: number;
  isVisible: boolean;
  isDisabled: boolean;
  children?: MenuItemWithChildren[];
}

/**
 * Get menu items for a specific user based on their roles
 * 
 * @description
 * Query logic:
 * 1. Get all roles of the user
 * 2. Get visible menu items through roles (DISTINCT)
 * 3. Filter out invisible or disabled items
 * 4. Sort by order
 * 
 * Permission logic:
 * - If menu item has no role permissions set → visible to everyone
 * - If menu item has role permissions set → only visible to users with that role and canView=true
 * 
 * @param userId - User ID
 * @param applicationId - Application ID (optional, if not provided returns all apps)
 * @returns Array of menu items with hierarchical structure
 */
export async function getUserMenuItems(
  userId: string,
  applicationId?: string
): Promise<MenuItemWithChildren[]> {
  // 1. Get all role IDs of the user
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = userRoles.map((ur) => ur.roleId);

  // If user has no roles, return menu items with no permission restrictions
  if (roleIds.length === 0) {
    return getPublicMenuItems(applicationId);
  }

  // 2. Query menu items (considering permissions)
  const menuItems = await db.menuItem.findMany({
    where: {
      ...(applicationId && { applicationId }),
      isVisible: true,
      isDisabled: false,
      OR: [
        // Case A: No role permissions set (public menu)
        {
          roleAccess: {
            none: {},
          },
        },
        // Case B: User's role has permission to view
        {
          roleAccess: {
            some: {
              roleId: { in: roleIds },
              canView: true,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      path: true,
      icon: true,
      type: true,
      parentId: true,
      order: true,
      isVisible: true,
      isDisabled: true,
    },
    orderBy: [
      { order: "asc" },
      { displayName: "asc" },
    ],
  });

  // 3. Build hierarchical structure
  return buildMenuTree(menuItems);
}

/**
 * Get public menu items (no role restrictions)
 * 
 * @param applicationId - Application ID (optional)
 * @returns Array of public menu items
 */
export async function getPublicMenuItems(
  applicationId?: string
): Promise<MenuItemWithChildren[]> {
  const menuItems = await db.menuItem.findMany({
    where: {
      ...(applicationId && { applicationId }),
      isVisible: true,
      isDisabled: false,
      roleAccess: {
        none: {}, // Only return menus with no role restrictions
      },
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      path: true,
      icon: true,
      type: true,
      parentId: true,
      order: true,
      isVisible: true,
      isDisabled: true,
    },
    orderBy: [
      { order: "asc" },
      { displayName: "asc" },
    ],
  });

  return buildMenuTree(menuItems);
}

/**
 * Build hierarchical menu tree from flat menu items
 * 
 * @param items - Flat array of menu items
 * @returns Hierarchical menu tree
 */
function buildMenuTree(
  items: Array<{
    id: string;
    parentId: string | null;
    [key: string]: any;
  }>
): MenuItemWithChildren[] {
  const itemMap = new Map<string, MenuItemWithChildren>();
  const rootItems: MenuItemWithChildren[] = [];

  // First pass: create all nodes
  items.forEach((item) => {
    const menuItem: MenuItemWithChildren = {
      ...item,
      children: [],
    };
    itemMap.set(item.id, menuItem);
  });

  // Second pass: establish parent-child relationships
  items.forEach((item) => {
    const menuItem = itemMap.get(item.id)!;

    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(menuItem);
      } else {
        // If parent node not found, treat as root node
        rootItems.push(menuItem);
      }
    } else {
      rootItems.push(menuItem);
    }
  });

  return rootItems;
}

/**
 * Check if user can access a specific menu item
 * 
 * @param userId - User ID
 * @param menuItemId - Menu Item ID
 * @returns Boolean indicating if user can access
 */
export async function canUserAccessMenuItem(
  userId: string,
  menuItemId: string
): Promise<boolean> {
  // 1. Get menu item
  const menuItem = await db.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      roleAccess: true,
    },
  });

  if (!menuItem) {
    return false;
  }

  // 2. If menu is disabled or not visible
  if (menuItem.isDisabled || !menuItem.isVisible) {
    return false;
  }

  // 3. If no role restrictions, everyone can access
  if (menuItem.roleAccess.length === 0) {
    return true;
  }

  // 4. Check user roles
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = userRoles.map((ur) => ur.roleId);

  // 5. Check if has access permission
  const hasAccess = menuItem.roleAccess.some(
    (access) => roleIds.includes(access.roleId) && access.canAccess
  );

  return hasAccess;
}

/**
 * Get all menu items for an application (admin use)
 * 
 * @param applicationId - Application ID
 * @returns All menu items for the application
 */
export async function getAllMenuItems(
  applicationId: string
): Promise<MenuItemWithChildren[]> {
  const menuItems = await db.menuItem.findMany({
    where: { applicationId },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      path: true,
      icon: true,
      type: true,
      parentId: true,
      order: true,
      isVisible: true,
      isDisabled: true,
    },
    orderBy: [
      { order: "asc" },
      { displayName: "asc" },
    ],
  });

  return buildMenuTree(menuItems);
}

/**
 * Get menu items by role
 * 
 * @param roleId - Role ID
 * @param applicationId - Application ID (optional)
 * @returns Menu items accessible by the role
 */
export async function getMenuItemsByRole(
  roleId: string,
  applicationId?: string
): Promise<MenuItemWithChildren[]> {
  const menuItems = await db.menuItem.findMany({
    where: {
      ...(applicationId && { applicationId }),
      isVisible: true,
      isDisabled: false,
      OR: [
        // Menu with no role restrictions
        {
          roleAccess: {
            none: {},
          },
        },
        // Menu that the role has permission to
        {
          roleAccess: {
            some: {
              roleId,
              canView: true,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      path: true,
      icon: true,
      type: true,
      parentId: true,
      order: true,
      isVisible: true,
      isDisabled: true,
    },
    orderBy: [
      { order: "asc" },
      { displayName: "asc" },
    ],
  });

  return buildMenuTree(menuItems);
}
