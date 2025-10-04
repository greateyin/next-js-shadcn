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
 * 查詢邏輯：
 * 1. 取得用戶的所有角色
 * 2. 透過角色取得可見的選單項目（DISTINCT）
 * 3. 過濾掉不可見或禁用的項目
 * 4. 按照 order 排序
 * 
 * 權限邏輯：
 * - 如果選單項目沒有設定任何角色權限 → 所有人可見
 * - 如果選單項目有設定角色權限 → 只有擁有該角色且 canView=true 的用戶可見
 * 
 * @param userId - User ID
 * @param applicationId - Application ID (optional, if not provided returns all apps)
 * @returns Array of menu items with hierarchical structure
 */
export async function getUserMenuItems(
  userId: string,
  applicationId?: string
): Promise<MenuItemWithChildren[]> {
  // 1. 取得用戶的所有角色 ID
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = userRoles.map((ur) => ur.roleId);

  // 如果用戶沒有任何角色，返回沒有權限限制的選單
  if (roleIds.length === 0) {
    return getPublicMenuItems(applicationId);
  }

  // 2. 查詢選單項目（考慮權限）
  const menuItems = await db.menuItem.findMany({
    where: {
      ...(applicationId && { applicationId }),
      isVisible: true,
      isDisabled: false,
      OR: [
        // 情況 A：沒有設定任何角色權限（公開選單）
        {
          roleAccess: {
            none: {},
          },
        },
        // 情況 B：用戶的角色有權限查看
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

  // 3. 建立階層式結構
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
        none: {}, // 只返回沒有角色限制的選單
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

  // 第一次遍歷：建立所有節點
  items.forEach((item) => {
    const menuItem: MenuItemWithChildren = {
      ...item,
      children: [],
    };
    itemMap.set(item.id, menuItem);
  });

  // 第二次遍歷：建立父子關係
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
        // 如果找不到父節點，視為根節點
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
  // 1. 取得選單項目
  const menuItem = await db.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      roleAccess: true,
    },
  });

  if (!menuItem) {
    return false;
  }

  // 2. 如果選單被禁用或不可見
  if (menuItem.isDisabled || !menuItem.isVisible) {
    return false;
  }

  // 3. 如果沒有角色限制，所有人都可以存取
  if (menuItem.roleAccess.length === 0) {
    return true;
  }

  // 4. 檢查用戶角色
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  const roleIds = userRoles.map((ur) => ur.roleId);

  // 5. 檢查是否有權限存取
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
        // 沒有角色限制的選單
        {
          roleAccess: {
            none: {},
          },
        },
        // 該角色有權限的選單
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
