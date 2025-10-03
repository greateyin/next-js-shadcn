/**
 * @fileoverview Logout button component
 * @module components/auth/logout-button
 * @description Provides a button component for user logout functionality
 * with loading state and error handling
 */

"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Props for the LogoutButton component
 * @interface
 * @property {React.ReactNode} [children] - Content to render inside the button
 */
interface LogoutButtonProps {
  children?: React.ReactNode;
}

/**
 * LogoutButton component for user logout
 * @component
 * @description A button component that:
 * - Handles user logout process
 * - Shows loading state during logout
 * - Handles errors gracefully
 * - Redirects to home page after logout
 * - Supports custom button content
 * 
 * @param {LogoutButtonProps} props - Component props
 * @param {React.ReactNode} [props.children] - Button content
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LogoutButton>
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
 * 
 * // With custom styling
 * <LogoutButton>
 *   <div className="flex items-center">
 *     <LogoutIcon className="mr-2" />
 *     <span>Sign out</span>
 *   </div>
 * </LogoutButton>
 * ```
 */
export function LogoutButton({ children }: LogoutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  /**
   * Handles the logout process
   * @async
   * @function
   * @description Signs out the user and handles loading state
   */
  const handleLogout = async () => {
    try {
      setIsPending(true);
      await signOut({
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsPending(false);
    }
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