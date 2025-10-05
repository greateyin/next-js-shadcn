import { adminStyles } from "@/lib/styles/admin";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Admin 页面标题组件
 * 
 * 提供统一的页面标题样式，可选描述和操作按钮
 * 
 * @example
 * <AdminPageHeader
 *   title="User Management"
 *   description="Manage system users and their roles"
 *   action={<Button>Add User</Button>}
 * />
 */
export function AdminPageHeader({ 
  title, 
  description, 
  action,
  className 
}: AdminPageHeaderProps) {
  return (
    <div className={`${adminStyles.headerContainer} ${className || ""}`}>
      <div className={adminStyles.headerContent}>
        <h2 className={adminStyles.headerTitle}>{title}</h2>
        {description && (
          <p className={adminStyles.headerDescription}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
