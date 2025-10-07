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
 * Admin standardized card component
 * 
 * Provides unified card styles with optional title, description and action buttons
 * 
 * @param noPadding - Whether to remove content area padding (for tables, etc.)
 * 
 * @example
 * // Card with title and description
 * <AdminCard
 *   title="Users"
 *   description="View and manage all users"
 * >
 *   <UsersTable />
 * </AdminCard>
 * 
 * @example
 * // Card without padding (for tables)
 * <AdminCard
 *   title="Users"
 *   description="View and manage all users"
 *   noPadding
 * >
 *   <UsersTable />
 * </AdminCard>
 * 
 * @example
 * // Card with action button
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
