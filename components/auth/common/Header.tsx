/**
 * @fileoverview Main header component for authentication pages
 * @module components/auth/common/Header
 * @description Provides a consistent header with custom font and
 * styling for authentication-related pages
 */

import { cn } from "@/lib/utils";

/**
 * Props for the Header component
 * @interface
 * @property {string} label - Text to display below the main heading
 */
interface HeaderProps {
  label: string;
}

/**
 * Header component for authentication pages
 * @component
 * @description A header component that:
 * - Applies consistent typographic styling with the app's sans-serif font
 * - Displays the application logo/name
 * - Shows a customizable label text
 * - Centers content with consistent spacing
 * 
 * @param {HeaderProps} props - Component props
 * @param {string} props.label - Label text to display
 * 
 * @example
 * ```tsx
 * // Basic usage - login page
 * <Header label="Welcome back" />
 * 
 * // Register page
 * <Header label="Create your account" />
 * 
 * // Password reset page
 * <Header label="Reset your password" />
 * 
 * // Within auth layout
 * <div className="auth-layout">
 *   <Header label="Sign in to continue" />
 *   <LoginForm />
 * </div>
 * ```
 */
export function Header({ label }: HeaderProps) {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
      <h1 className={cn("text-3xl font-semibold tracking-tight text-gray-900 font-sans")}> 
        🔐 Auth
      </h1>
      <p className="text-gray-600 text-sm">
        {label}
      </p>
    </div>
  );
}