/**
 * @fileoverview Authentication requirement wrapper component
 * @module components/auth/common/RequireAuth
 * @description Higher-order component that ensures routes are protected
 * and only accessible to authenticated users with optional role requirements
 */

"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Session } from "next-auth";

/**
 * Props for the RequireAuth component
 * @interface
 * @property {React.ReactNode | ((session: Session) => React.ReactNode)} children - Content to render when authenticated
 * @property {string} [requireRole] - Optional role required for access
 */
interface RequireAuthProps {
  children: React.ReactNode | ((session: Session) => React.ReactNode);
  requireRole?: string;
}

/**
 * RequireAuth component for route protection
 * @component
 * @description A higher-order component that:
 * - Protects routes from unauthorized access
 * - Handles authentication state management
 * - Shows loading states during auth checks
 * - Supports role-based access control
 * - Redirects unauthenticated users
 * - Provides type-safe session data
 * 
 * @param {RequireAuthProps} props - Component props
 * @param {React.ReactNode | ((session: Session) => React.ReactNode)} props.children - Protected content
 * @param {string} [props.requireRole] - Required role for access
 * 
 * @example
 * ```tsx
 * // Basic route protection
 * <RequireAuth>
 *   <DashboardPage />
 * </RequireAuth>
 * 
 * // With role requirement
 * <RequireAuth requireRole="admin">
 *   <AdminDashboard />
 * </RequireAuth>
 * 
 * // With session data
 * <RequireAuth>
 *   {(session) => (
 *     <div>
 *       <h1>Welcome {session.user.name}</h1>
 *       <ProtectedContent />
 *     </div>
 *   )}
 * </RequireAuth>
 * 
 * // Within layout
 * <Layout>
 *   <RequireAuth>
 *     <Sidebar />
 *     <MainContent />
 *   </RequireAuth>
 * </Layout>
 * ```
 * 
 * @throws {Error} If role is required but user doesn't have it
 * @returns {JSX.Element | null} Protected content or loading state
 */
export function RequireAuth({ children, requireRole }: RequireAuthProps) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  /**
   * Loading state while checking authentication
   */
  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Skeleton className="w-[100px] h-[20px]" />
      </div>
    );
  }

  /**
   * Redirect if not authenticated
   */
  if (!session?.user) {
    redirect("/auth/login");
    return null;
  }

  /**
   * Check role requirement if specified
   */
  if (requireRole) {
    // ⚠️ SECURITY: Check roleNames array (from UserRole join table)
    // Do NOT use user.role - it doesn't exist in the database
    const hasRequiredRole = session.user.roleNames?.includes(requireRole);

    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-destructive">
            Access denied. Required role: {requireRole}
          </p>
        </div>
      );
    }
  }

  /**
   * Render protected content
   */
  return (
    <>
      {typeof children === "function" ? children(session) : children}
    </>
  );
}
