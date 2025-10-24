"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Session } from "next-auth";
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
import { checkCircularReference } from "@/lib/menu/circularReferenceCheck";
import { incrementMenuItemVersion, incrementApplicationMenuVersion } from "@/lib/menu/menuVersion";
import { logAuditSuccess, logAuditFailure } from "@/lib/audit/auditLogger";

/**
 * Validate that the current session has administrator privileges.
 */
function hasAdminAccess(session: Session | null): boolean {
  if (!session?.user?.id) {
    return false;
  }

  const roleNames = session.user.roleNames ?? [];

  return (
    session.user.role === "admin" ||
    roleNames.includes("admin") ||
    roleNames.includes("super-admin")
  );
}

/**
 * Get all menu items
 * Includes associated applications, parent items, child items, and role access permissions
 */
export async function getMenuItems() {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
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
 * Get menu items by application
 */
export async function getMenuItemsByApplication(applicationId: string) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
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
 * Create a new menu item
 */
export async function createMenuItem(data: CreateMenuItemInput) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    // Validate input
    const validatedData = CreateMenuItemSchema.parse(data);

    // Check if application exists
    const application = await db.application.findUnique({
      where: { id: validatedData.applicationId },
    });

    if (!application) {
      return { error: "Application not found" };
    }

    // Check if name already exists in this application
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

    // Check if path already exists in this application
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

    // If there's a parent item, check if it exists and belongs to the same application
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

    // Create menu item
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
        version: 0,
      },
      include: {
        application: true,
        parent: true,
      },
    });

    // Increment application menu version for cache invalidation
    await incrementApplicationMenuVersion(validatedData.applicationId);

    // Log audit
    await logAuditSuccess(
      session.user.id,
      'CREATE',
      'MENU_ITEM',
      menuItem.id,
      menuItem
    );

    return { success: "Menu item created successfully", menuItem };
  } catch (error) {
    console.error("[CREATE_MENU_ITEM]", error);
    return { error: "Failed to create menu item" };
  }
}

/**
 * Update a menu item
 */
export async function updateMenuItem(data: UpdateMenuItemInput) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    // Validate input
    const validatedData = UpdateMenuItemSchema.parse(data);

    // Check if menu item exists
    const existingMenuItem = await db.menuItem.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingMenuItem) {
      return { error: "Menu item not found" };
    }

    // If updating name, check for conflicts with other menu items in the same application
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

    // If updating path, check for conflicts with other menu items in the same application
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

    // If updating parentId, check if parent exists and won't create circular reference
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId) {
        // Check if parent item exists
        const parentItem = await db.menuItem.findUnique({
          where: { id: validatedData.parentId },
        });

        if (!parentItem) {
          return { error: "Parent menu item not found" };
        }

        // Check if belongs to the same application
        if (parentItem.applicationId !== existingMenuItem.applicationId) {
          return { error: "Parent menu item must belong to the same application" };
        }

        // Check if will create circular reference (optimized iterative approach)
        const hasCircularReference = await checkCircularReference(
          validatedData.id,
          validatedData.parentId
        );

        if (hasCircularReference) {
          return { error: "Cannot create circular reference in menu hierarchy" };
        }
      }
    }

    // Update menu item
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
        // Increment version for cache invalidation
        version: {
          increment: 1
        }
      },
      include: {
        application: true,
        parent: true,
      },
    });

    // Increment application menu version for cache invalidation
    await incrementApplicationMenuVersion(existingMenuItem.applicationId);

    // Log audit
    await logAuditSuccess(
      session.user.id,
      'UPDATE',
      'MENU_ITEM',
      updatedMenuItem.id,
      updatedMenuItem
    );

    return { success: "Menu item updated successfully", menuItem: updatedMenuItem };
  } catch (error) {
    console.error("[UPDATE_MENU_ITEM]", error);
    return { error: "Failed to update menu item" };
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(data: DeleteMenuItemInput) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    // Validate input
    const validatedData = DeleteMenuItemSchema.parse(data);

    // Check if menu item exists
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

    // Check if has child items
    if (menuItem._count.children > 0) {
      return {
        error: `Cannot delete menu item with ${menuItem._count.children} child item(s). Please delete or reassign child items first.`,
      };
    }

    // Delete menu item (will automatically delete related MenuItemRole records due to onDelete: Cascade)
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
 * Manage menu item role access permissions
 */
export async function manageMenuItemRoles(data: ManageMenuItemRolesInput) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    // Validate input
    const validatedData = ManageMenuItemRolesSchema.parse(data);

    // Check if menu item exists
    const menuItem = await db.menuItem.findUnique({
      where: { id: validatedData.menuItemId },
    });

    if (!menuItem) {
      return { error: "Menu item not found" };
    }

    // Update role access permissions in a transaction
    await db.$transaction(async (tx: any) => {
      // Delete existing role access records
      await tx.menuItemRole.deleteMany({
        where: { menuItemId: validatedData.menuItemId },
      });

      // Create new role access records
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
 * Batch update menu item order
 */
export async function updateMenuItemsOrder(data: UpdateMenuItemsOrderInput) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    // Validate input
    const validatedData = UpdateMenuItemsOrderSchema.parse(data);

    // Update all menu item orders in a transaction
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

/**
 * Toggle menu item visibility
 */
export async function toggleMenuVisibility(data: { id: string; isVisible: boolean }) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    const menuItem = await db.menuItem.update({
      where: { id: data.id },
      data: { isVisible: data.isVisible },
    });

    return {
      success: `Menu item ${data.isVisible ? "shown" : "hidden"} successfully`,
      menuItem,
    };
  } catch (error) {
    console.error("[TOGGLE_MENU_VISIBILITY]", error);
    return { error: "Failed to toggle menu visibility" };
  }
}

/**
 * Toggle menu item disabled state
 */
export async function toggleMenuDisabled(data: { id: string; isDisabled: boolean }) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session)) {
      return { error: "Unauthorized" };
    }

    const menuItem = await db.menuItem.update({
      where: { id: data.id },
      data: { isDisabled: data.isDisabled },
    });

    return {
      success: `Menu item ${data.isDisabled ? "disabled" : "enabled"} successfully`,
      menuItem,
    };
  } catch (error) {
    console.error("[TOGGLE_MENU_DISABLED]", error);
    return { error: "Failed to toggle menu disabled state" };
  }
}
