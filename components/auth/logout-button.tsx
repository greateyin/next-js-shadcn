/**
 * @fileoverview Logout button component - Auth.js V5 Best Practices
 * @module components/auth/logout-button
 * @description Provides a button component for user logout functionality
 * using Server Actions following Auth.js V5 best practices
 */

"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { logoutAction } from "@/actions/auth";

/**
 * Props for the LogoutButton component
 * @interface
 * @property {React.ReactNode} [children] - Content to render inside the button
 * @property {string} [redirectTo] - Optional redirect URL after logout
 */
interface LogoutButtonProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * LogoutButton component for user logout
 * @component
 * @description A button component that follows Auth.js V5 best practices:
 * - Uses Server Actions instead of client-side signOut
 * - Automatic redirect handling by Auth.js
 * - Better security (server-side session invalidation)
 * - Shows loading state during logout
 * - Supports custom button content and redirect URL
 * 
 * @param {LogoutButtonProps} props - Component props
 * @param {React.ReactNode} [props.children] - Button content
 * @param {string} [props.redirectTo="/"] - Redirect URL after logout
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LogoutButton>
 *   Sign out
 * </LogoutButton>
 * 
 * // With custom redirect
 * <LogoutButton redirectTo="/auth/login">
 *   Sign out
 * </LogoutButton>
 * 
 * // With icon
 * <LogoutButton>
 *   <LogoutIcon className="mr-2 h-4 w-4" />
 *   Logout
 * </LogoutButton>
 * 
 * // Within dropdown menu
 * <DropdownMenu>
 *   <DropdownMenuItem>
 *     <LogoutButton>
 *       Sign out of account
 *     </LogoutButton>
 *   </DropdownMenuItem>
 * </DropdownMenu>
 * ```
 */
export function LogoutButton({ children, redirectTo = "/" }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  /**
   * Handles the logout process using Server Action
   * @function
   * @description Calls the logout Server Action with automatic redirect
   */
  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction(redirectTo);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="w-full p-0"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        children
      )}
    </Button>
  );
}