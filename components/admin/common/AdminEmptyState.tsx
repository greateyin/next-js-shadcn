import { adminStyles } from "@/lib/styles/admin";

interface AdminEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Admin empty state component
 * 
 * Used to display friendly prompt when there is no data
 * 
 * @example
 * <AdminEmptyState
 *   title="No users found"
 *   description="Add your first user to get started"
 *   action={<Button>Add User</Button>}
 * />
 * 
 * @example
 * // Empty state with icon
 * <AdminEmptyState
 *   title="No results"
 *   description="Try adjusting your search"
 *   icon={<SearchIcon className="h-12 w-12" />}
 * />
 */
export function AdminEmptyState({
  title,
  description,
  icon,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={`${adminStyles.empty.container} ${className || ""}`}>
      {icon && <div className={adminStyles.empty.icon}>{icon}</div>}
      <h3 className={adminStyles.empty.title}>{title}</h3>
      {description && (
        <p className={adminStyles.empty.description}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
