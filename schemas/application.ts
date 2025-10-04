import * as z from "zod";

/**
 * 創建應用程式的驗證 Schema
 */
export const createApplicationSchema = z.object({
  name: z
    .string()
    .min(1, "應用程式名稱為必填")
    .max(50, "應用程式名稱不能超過 50 個字元")
    .regex(/^[a-zA-Z0-9-_]+$/, "應用程式名稱只能包含字母、數字、連字符和底線"),
  displayName: z
    .string()
    .min(1, "顯示名稱為必填")
    .max(100, "顯示名稱不能超過 100 個字元"),
  description: z
    .string()
    .max(500, "描述不能超過 500 個字元")
    .optional()
    .nullable(),
  path: z
    .string()
    .min(1, "路徑為必填")
    .max(100, "路徑不能超過 100 個字元")
    .regex(/^[a-zA-Z0-9\-_\/]+$/, "路徑只能包含字母、數字、連字符、底線和斜線"),
  icon: z
    .string()
    .max(50, "圖標名稱不能超過 50 個字元")
    .optional()
    .nullable(),
  order: z
    .number()
    .int("排序必須為整數")
    .min(0, "排序不能小於 0")
    .default(0),
  isActive: z.boolean().default(true),
});

/**
 * 更新應用程式的驗證 Schema
 */
export const updateApplicationSchema = z.object({
  id: z.string().min(1, "應用程式 ID 為必填"),
  name: z
    .string()
    .min(1, "應用程式名稱為必填")
    .max(50, "應用程式名稱不能超過 50 個字元")
    .regex(/^[a-zA-Z0-9-_]+$/, "應用程式名稱只能包含字母、數字、連字符和底線")
    .optional(),
  displayName: z
    .string()
    .min(1, "顯示名稱為必填")
    .max(100, "顯示名稱不能超過 100 個字元")
    .optional(),
  description: z
    .string()
    .max(500, "描述不能超過 500 個字元")
    .optional()
    .nullable(),
  path: z
    .string()
    .min(1, "路徑為必填")
    .max(100, "路徑不能超過 100 個字元")
    .regex(/^[a-zA-Z0-9\-_\/]+$/, "路徑只能包含字母、數字、連字符、底線和斜線")
    .optional(),
  icon: z
    .string()
    .max(50, "圖標名稱不能超過 50 個字元")
    .optional()
    .nullable(),
  order: z
    .number()
    .int("排序必須為整數")
    .min(0, "排序不能小於 0")
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * 切換應用程式狀態的驗證 Schema
 */
export const toggleApplicationStatusSchema = z.object({
  id: z.string().min(1, "應用程式 ID 為必填"),
  isActive: z.boolean(),
});

/**
 * 刪除應用程式的驗證 Schema
 */
export const deleteApplicationSchema = z.object({
  id: z.string().min(1, "應用程式 ID 為必填"),
});

/**
 * 管理應用程式角色存取的驗證 Schema
 */
export const manageApplicationRolesSchema = z.object({
  applicationId: z.string().min(1, "應用程式 ID 為必填"),
  roleIds: z.array(z.string()).min(0, "角色 ID 陣列為必填"),
});

/**
 * TypeScript 類型導出
 */
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ToggleApplicationStatusInput = z.infer<typeof toggleApplicationStatusSchema>;
export type DeleteApplicationInput = z.infer<typeof deleteApplicationSchema>;
export type ManageApplicationRolesInput = z.infer<typeof manageApplicationRolesSchema>;
