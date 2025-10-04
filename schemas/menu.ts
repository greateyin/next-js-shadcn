import * as z from "zod";

/**
 * 選單項目類型列舉
 */
export const MenuItemTypeEnum = z.enum(["LINK", "GROUP", "DIVIDER", "EXTERNAL"]);

/**
 * 創建選單項目的驗證 Schema
 */
export const CreateMenuItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Name can only contain letters, numbers, hyphens and underscores"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  path: z
    .string()
    .min(1, "Path is required")
    .max(200, "Path must be less than 200 characters")
    .regex(/^\/[a-zA-Z0-9/_-]*$/, "Path must start with / and contain only valid URL characters"),
  icon: z
    .string()
    .max(50, "Icon name must be less than 50 characters")
    .optional()
    .nullable(),
  type: MenuItemTypeEnum.default("LINK"),
  parentId: z.string().optional().nullable(),
  applicationId: z.string().min(1, "Application is required"),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  isDisabled: z.boolean().default(false),
});

/**
 * 更新選單項目的驗證 Schema
 */
export const UpdateMenuItemSchema = z.object({
  id: z.string().min(1, "Menu item ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Name can only contain letters, numbers, hyphens and underscores")
    .optional(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  path: z
    .string()
    .min(1, "Path is required")
    .max(200, "Path must be less than 200 characters")
    .regex(/^\/[a-zA-Z0-9/_-]*$/, "Path must start with / and contain only valid URL characters")
    .optional(),
  icon: z
    .string()
    .max(50, "Icon name must be less than 50 characters")
    .optional()
    .nullable(),
  type: MenuItemTypeEnum.optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  isDisabled: z.boolean().optional(),
});

/**
 * 刪除選單項目的驗證 Schema
 */
export const DeleteMenuItemSchema = z.object({
  id: z.string().min(1, "Menu item ID is required"),
});

/**
 * 管理選單項目角色存取權限的驗證 Schema
 */
export const ManageMenuItemRolesSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  roleIds: z.array(z.string()).default([]),
  canView: z.boolean().default(true),
  canAccess: z.boolean().default(true),
});

/**
 * 批量更新選單項目順序的驗證 Schema
 */
export const UpdateMenuItemsOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1, "Menu item ID is required"),
      order: z.number().int().min(0),
    })
  ),
});

/**
 * TypeScript 類型推導
 */
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
export type DeleteMenuItemInput = z.infer<typeof DeleteMenuItemSchema>;
export type ManageMenuItemRolesInput = z.infer<typeof ManageMenuItemRolesSchema>;
export type UpdateMenuItemsOrderInput = z.infer<typeof UpdateMenuItemsOrderSchema>;
