"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  CreateMenuItemSchema,
  UpdateMenuItemSchema,
  DeleteMenuItemSchema,
  ManageMenuItemRolesSchema,
  UpdateMenuItemsOrderSchema,
  type CreateMenuItemInput,
  type UpdateMenuItemInput,
  type DeleteMenuItemInput,
  type ManageMenuItemRolesInput,
  type UpdateMenuItemsOrderInput,
} from "@/schemas/menu";

/**
 * 獲取所有選單項目
 * 包含關聯的應用程式、父項目、子項目和角色存取權限
 */
export async function getMenuItems() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    const menuItems = await db.menuItem.findMany({
      include: {
        application: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        roleAccess: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return { menuItems };
  } catch (error) {
    console.error("[GET_MENU_ITEMS]", error);
    return { error: "Failed to fetch menu items" };
  }
}

/**
 * 根據應用程式獲取選單項目
 */
export async function getMenuItemsByApplication(applicationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    const menuItems = await db.menuItem.findMany({
      where: { applicationId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        roleAccess: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return { menuItems };
  } catch (error) {
    console.error("[GET_MENU_ITEMS_BY_APPLICATION]", error);
    return { error: "Failed to fetch menu items" };
  }
}

/**
 * 創建新的選單項目
 */
export async function createMenuItem(data: CreateMenuItemInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    // 驗證輸入
    const validatedData = CreateMenuItemSchema.parse(data);

    // 檢查應用程式是否存在
    const application = await db.application.findUnique({
      where: { id: validatedData.applicationId },
    });

    if (!application) {
      return { error: "Application not found" };
    }

    // 檢查 name 是否在該應用程式中已存在
    const existingName = await db.menuItem.findUnique({
      where: {
        applicationId_name: {
          applicationId: validatedData.applicationId,
          name: validatedData.name,
        },
      },
    });

    if (existingName) {
      return { error: "Menu item with this name already exists in this application" };
    }

    // 檢查 path 是否在該應用程式中已存在
    const existingPath = await db.menuItem.findUnique({
      where: {
        applicationId_path: {
          applicationId: validatedData.applicationId,
          path: validatedData.path,
        },
      },
    });

    if (existingPath) {
      return { error: "Menu item with this path already exists in this application" };
    }

    // 如果有父項目，檢查父項目是否存在且屬於同一應用程式
    if (validatedData.parentId) {
      const parentItem = await db.menuItem.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentItem) {
        return { error: "Parent menu item not found" };
      }

      if (parentItem.applicationId !== validatedData.applicationId) {
        return { error: "Parent menu item must belong to the same application" };
      }
    }

    // 創建選單項目
    const menuItem = await db.menuItem.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description,
        path: validatedData.path,
        icon: validatedData.icon,
        type: validatedData.type,
        parentId: validatedData.parentId,
        applicationId: validatedData.applicationId,
        order: validatedData.order,
        isVisible: validatedData.isVisible,
        isDisabled: validatedData.isDisabled,
      },
      include: {
        application: true,
        parent: true,
      },
    });

    return { success: "Menu item created successfully", menuItem };
  } catch (error) {
    console.error("[CREATE_MENU_ITEM]", error);
    return { error: "Failed to create menu item" };
  }
}

/**
 * 更新選單項目
 */
export async function updateMenuItem(data: UpdateMenuItemInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    // 驗證輸入
    const validatedData = UpdateMenuItemSchema.parse(data);

    // 檢查選單項目是否存在
    const existingMenuItem = await db.menuItem.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingMenuItem) {
      return { error: "Menu item not found" };
    }

    // 如果更新 name，檢查是否與同應用程式的其他選單項目衝突
    if (validatedData.name && validatedData.name !== existingMenuItem.name) {
      const conflictingName = await db.menuItem.findFirst({
        where: {
          applicationId: existingMenuItem.applicationId,
          name: validatedData.name,
          id: { not: validatedData.id },
        },
      });

      if (conflictingName) {
        return { error: "Menu item with this name already exists in this application" };
      }
    }

    // 如果更新 path，檢查是否與同應用程式的其他選單項目衝突
    if (validatedData.path && validatedData.path !== existingMenuItem.path) {
      const conflictingPath = await db.menuItem.findFirst({
        where: {
          applicationId: existingMenuItem.applicationId,
          path: validatedData.path,
          id: { not: validatedData.id },
        },
      });

      if (conflictingPath) {
        return { error: "Menu item with this path already exists in this application" };
      }
    }

    // 如果更新 parentId，檢查父項目是否存在且不會造成循環參照
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId) {
        // 檢查父項目是否存在
        const parentItem = await db.menuItem.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentItem) {
          return { error: "Parent menu item not found" };
        }

        // 檢查是否屬於同一應用程式
        if (parentItem.applicationId !== existingMenuItem.applicationId) {
          return { error: "Parent menu item must belong to the same application" };
        }

        // 檢查是否會造成循環參照（不能將父項目設為自己或自己的子項目）
        if (validatedData.parentId === validatedData.id) {
          return { error: "Menu item cannot be its own parent" };
        }

        // 遞迴檢查子項目
        const checkCircularReference = async (itemId: string, targetId: string): Promise<boolean> => {
          const children = await db.menuItem.findMany({
            where: { parentId: itemId },
            select: { id: true },
          });

          for (const child of children) {
            if (child.id === targetId) {
              return true;
            }
            if (await checkCircularReference(child.id, targetId)) {
              return true;
            }
          }

          return false;
        };

        const hasCircularReference = await checkCircularReference(
          validatedData.id,
          validatedData.parentId
        );

        if (hasCircularReference) {
          return { error: "Cannot create circular reference in menu hierarchy" };
        }
      }
    }

    // 更新選單項目
    const updatedMenuItem = await db.menuItem.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.displayName && { displayName: validatedData.displayName }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.path && { path: validatedData.path }),
        ...(validatedData.icon !== undefined && { icon: validatedData.icon }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.parentId !== undefined && { parentId: validatedData.parentId }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
        ...(validatedData.isVisible !== undefined && { isVisible: validatedData.isVisible }),
        ...(validatedData.isDisabled !== undefined && { isDisabled: validatedData.isDisabled }),
      },
      include: {
        application: true,
        parent: true,
      },
    });

    return { success: "Menu item updated successfully", menuItem: updatedMenuItem };
  } catch (error) {
    console.error("[UPDATE_MENU_ITEM]", error);
    return { error: "Failed to update menu item" };
  }
}

/**
 * 刪除選單項目
 */
export async function deleteMenuItem(data: DeleteMenuItemInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    // 驗證輸入
    const validatedData = DeleteMenuItemSchema.parse(data);

    // 檢查選單項目是否存在
    const menuItem = await db.menuItem.findUnique({
      where: { id: validatedData.id },
      include: {
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!menuItem) {
      return { error: "Menu item not found" };
    }

    // 檢查是否有子項目
    if (menuItem._count.children > 0) {
      return {
        error: `Cannot delete menu item with ${menuItem._count.children} child item(s). Please delete or reassign child items first.`,
      };
    }

    // 刪除選單項目（會自動刪除相關的 MenuItemRole 記錄，因為有 onDelete: Cascade）
    await db.menuItem.delete({
      where: { id: validatedData.id },
    });

    return { success: "Menu item deleted successfully" };
  } catch (error) {
    console.error("[DELETE_MENU_ITEM]", error);
    return { error: "Failed to delete menu item" };
  }
}

/**
 * 管理選單項目的角色存取權限
 */
export async function manageMenuItemRoles(data: ManageMenuItemRolesInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    // 驗證輸入
    const validatedData = ManageMenuItemRolesSchema.parse(data);

    // 檢查選單項目是否存在
    const menuItem = await db.menuItem.findUnique({
      where: { id: validatedData.menuItemId },
    });

    if (!menuItem) {
      return { error: "Menu item not found" };
    }

    // 在事務中更新角色存取權限
    await db.$transaction(async (tx: typeof db) => {
      // 刪除現有的角色存取記錄
      await tx.menuItemRole.deleteMany({
        where: { menuItemId: validatedData.menuItemId },
      });

      // 創建新的角色存取記錄
      if (validatedData.roleIds.length > 0) {
        await tx.menuItemRole.createMany({
          data: validatedData.roleIds.map((roleId) => ({
            menuItemId: validatedData.menuItemId,
            roleId,
            canView: validatedData.canView,
            canAccess: validatedData.canAccess,
          })),
        });
      }
    });

    return { success: "Menu item role access updated successfully" };
  } catch (error) {
    console.error("[MANAGE_MENU_ITEM_ROLES]", error);
    return { error: "Failed to update menu item role access" };
  }
}

/**
 * 批量更新選單項目順序
 */
export async function updateMenuItemsOrder(data: UpdateMenuItemsOrderInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "Unauthorized" };
    }

    // 驗證輸入
    const validatedData = UpdateMenuItemsOrderSchema.parse(data);

    // 在事務中更新所有選單項目的順序
    await db.$transaction(
      validatedData.items.map((item) =>
        db.menuItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return { success: "Menu items order updated successfully" };
  } catch (error) {
    console.error("[UPDATE_MENU_ITEMS_ORDER]", error);
    return { error: "Failed to update menu items order" };
  }
}
