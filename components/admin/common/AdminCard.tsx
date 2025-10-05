import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStyles, cn } from "@/lib/styles/admin";

interface AdminCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

/**
 * Admin 标准化卡片组件
 * 
 * 提供统一的卡片样式，包含可选的标题、描述和操作按钮
 * 
 * @param noPadding - 是否移除内容区域的内边距（用于表格等）
 * 
 * @example
 * // 带标题和描述的卡片
 * <AdminCard
 *   title="Users"
 *   description="View and manage all users"
 * >
 *   <UsersTable />
 * </AdminCard>
 * 
 * @example
 * // 无内边距的卡片（用于表格）
 * <AdminCard
 *   title="Users"
 *   description="View and manage all users"
 *   noPadding
 * >
 *   <UsersTable />
 * </AdminCard>
 * 
 * @example
 * // 带操作按钮的卡片
 * <AdminCard
 *   title="Users"
 *   headerAction={<Button>Add User</Button>}
 * >
 *   <UsersTable />
 * </AdminCard>
 */
export function AdminCard({
  title,
  description,
  children,
  headerAction,
  noPadding = false,
  className,
}: AdminCardProps) {
  return (
    <Card className={cn(adminStyles.card.base, className)}>
      {(title || description || headerAction) && (
        <CardHeader className={adminStyles.card.header}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <CardTitle className={adminStyles.card.title}>
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className={adminStyles.card.description}>
                  {description}
                </CardDescription>
              )}
            </div>
            {headerAction && <div className="ml-4">{headerAction}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={noPadding ? adminStyles.card.content : adminStyles.card.contentWithPadding}>
        {children}
      </CardContent>
    </Card>
  );
}
