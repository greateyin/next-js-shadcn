/**
 * @fileoverview User profile button component
 * @module components/auth/user-button
 * @description Server component that displays the user's profile button with
 * avatar and dropdown menu for account-related actions
 */

import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "./logout-button";

/**
 * UserButton component for user profile interactions
 * @component
 * @description A server component that:
 * - Displays the user's avatar with image or fallback
 * - Provides a dropdown menu for account actions
 * - Shows user email and name
 * - Includes logout functionality
 * - Handles authenticated and guest states
 * 
 * @example
 * ```tsx
 * // Basic usage in header
 * <header>
 *   <UserButton />
 * </header>
 * 
 * // With custom styling
 * <div className="user-profile">
 *   <UserButton />
 * </div>
 * 
 * // Within navigation
 * <nav>
 *   <div className="nav-items">
 *     <Link href="/dashboard">Dashboard</Link>
 *     <UserButton />
 *   </div>
 * </nav>
 * ```
 * 
 * @returns {JSX.Element | null} UserButton component or null if no user session
 */
export async function UserButton() {
  /**
   * Get the user session from the auth module
   * @type {Promise<import('@/auth').Session | null>}
   */
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    /**
     * Dropdown menu for user profile actions
     * @type {JSX.Element}
     */
    <DropdownMenu>
      {/**
       * Trigger for the dropdown menu
       * @type {JSX.Element}
       */}
      <DropdownMenuTrigger>
        {/**
         * User avatar with image or fallback
         * @type {JSX.Element}
         */}
        <Avatar>
          {/**
           * User avatar image
           * @type {JSX.Element}
           */}
          <AvatarImage src={session.user.image || undefined} />
          {/**
           * Fallback for user avatar image
           * @type {JSX.Element}
           */}
          <AvatarFallback>
            {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      {/**
       * Content of the dropdown menu
       * @type {JSX.Element}
       */}
      <DropdownMenuContent className="w-60" align="end">
        {/**
         * User profile information
         * @type {JSX.Element}
         */}
        <div className="flex items-center justify-start gap-2 p-2">
          {/**
           * User name and email
           * @type {JSX.Element}
           */}
          <div className="flex flex-col space-y-1 leading-none">
            {session.user.name && (
              <p className="font-medium">{session.user.name}</p>
            )}
            {session.user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        {/**
         * Logout button
         * @type {JSX.Element}
         */}
        <DropdownMenuItem asChild>
          <LogoutButton>Log out</LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}