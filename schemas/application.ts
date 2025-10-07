import * as z from "zod";

/**
 * Validation schema for creating an application
 */
export const createApplicationSchema = z.object({
  name: z
    .string()
    .min(1, "Application name is required")
    .max(50, "Application name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9-_]+$/, "Application name can only contain letters, numbers, hyphens, and underscores"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  path: z
    .string()
    .min(1, "Path is required")
    .max(100, "Path cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\-_\/]+$/, "Path can only contain letters, numbers, hyphens, underscores, and slashes"),
  icon: z
    .string()
    .max(50, "Icon name cannot exceed 50 characters")
    .optional()
    .nullable(),
  order: z
    .number()
    .int("Order must be an integer")
    .min(0, "Order cannot be less than 0")
    .default(0),
  isActive: z.boolean().default(true),
});

/**
 * Validation schema for updating an application
 */
export const updateApplicationSchema = z.object({
  id: z.string().min(1, "Application ID is required"),
  name: z
    .string()
    .min(1, "Application name is required")
    .max(50, "Application name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9-_]+$/, "Application name can only contain letters, numbers, hyphens, and underscores")
    .optional(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  path: z
    .string()
    .min(1, "Path is required")
    .max(100, "Path cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\-_\/]+$/, "Path can only contain letters, numbers, hyphens, underscores, and slashes")
    .optional(),
  icon: z
    .string()
    .max(50, "Icon name cannot exceed 50 characters")
    .optional()
    .nullable(),
  order: z
    .number()
    .int("Order must be an integer")
    .min(0, "Order cannot be less than 0")
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Validation schema for toggling application status
 */
export const toggleApplicationStatusSchema = z.object({
  id: z.string().min(1, "Application ID is required"),
  isActive: z.boolean(),
});

/**
 * Validation schema for deleting an application
 */
export const deleteApplicationSchema = z.object({
  id: z.string().min(1, "Application ID is required"),
});

/**
 * Validation schema for managing application role access
 */
export const manageApplicationRolesSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  roleIds: z.array(z.string()).min(0, "Role IDs array is required"),
});

/**
 * TypeScript type exports
 */
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ToggleApplicationStatusInput = z.infer<typeof toggleApplicationStatusSchema>;
export type DeleteApplicationInput = z.infer<typeof deleteApplicationSchema>;
export type ManageApplicationRolesInput = z.infer<typeof manageApplicationRolesSchema>;
