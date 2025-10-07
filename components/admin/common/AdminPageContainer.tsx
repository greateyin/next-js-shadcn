import { adminStyles } from "@/lib/styles/admin";

interface AdminPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Admin page main container
 * 
 * Provides unified page layout container with standard spacing
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
