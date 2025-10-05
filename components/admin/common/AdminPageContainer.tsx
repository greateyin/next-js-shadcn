import { adminStyles } from "@/lib/styles/admin";

interface AdminPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Admin 页面主容器
 * 
 * 提供统一的页面布局容器，包含标准间距
 * 
 * @example
 * <AdminPageContainer>
 *   <AdminPageHeader title="Page Title" />
 *   <AdminCard>Content</AdminCard>
 * </AdminPageContainer>
 */
export function AdminPageContainer({ 
  children, 
  className 
}: AdminPageContainerProps) {
  return (
    <div className={`${adminStyles.pageContainer} ${className || ""}`}>
      {children}
    </div>
  );
}
