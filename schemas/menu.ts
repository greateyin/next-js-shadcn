import * as z from "zod";

/**
 * Menu item type enumeration
 */
export const MenuItemTypeEnum = z.enum(["LINK", "GROUP", "DIVIDER", "EXTERNAL"]);

/**
 * Validation schema for creating a menu item
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
 * Validation schema for updating a menu item
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
 * Validation schema for deleting a menu item
 */
export const DeleteMenuItemSchema = z.object({
  id: z.string().min(1, "Menu item ID is required"),
});

/**
 * Validation schema for managing menu item role access permissions
 */
export const ManageMenuItemRolesSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  roleIds: z.array(z.string()).default([]),
  canView: z.boolean().default(true),
  canAccess: z.boolean().default(true),
});

/**
 * Validation schema for batch updating menu item order
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
 * TypeScript type inference
 */
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
export type DeleteMenuItemInput = z.infer<typeof DeleteMenuItemSchema>;
export type ManageMenuItemRolesInput = z.infer<typeof ManageMenuItemRolesSchema>;
export type UpdateMenuItemsOrderInput = z.infer<typeof UpdateMenuItemsOrderSchema>;
