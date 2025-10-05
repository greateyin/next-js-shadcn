/**
 * Admin 通用组件导出
 * 
 * 统一导出所有 Admin 通用组件，便于使用
 * 
 * @example
 * import {
 *   AdminPageContainer,
 *   AdminPageHeader,
 *   AdminCard,
 *   AdminLoadingState,
 * } from "@/components/admin/common";
 */

export { AdminPageContainer } from "./AdminPageContainer";
export { AdminPageHeader } from "./AdminPageHeader";
export { AdminCard } from "./AdminCard";
export { AdminLoadingState } from "./AdminLoadingState";
export { AdminEmptyState } from "./AdminEmptyState";

// 导出样式常量（便于直接访问）
export { adminStyles, cn } from "@/lib/styles/admin";
