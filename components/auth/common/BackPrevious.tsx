/**
 * @fileoverview Back to previous page navigation component
 * @module components/auth/common/BackPrevious
 * @description Provides a centered navigation button for returning
 * to previous pages in the authentication flow
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Props for the BackPrevious component
 * @interface
 * @property {string} href - URL to navigate to when clicked
 * @property {string} label - Text to display on the button
 */
interface BackPreviousProps {
  href: string;
  label: string;
}

/**
 * BackPrevious component for navigation
 * @component
 * @description A centered button component that:
 * - Provides consistent styling for back navigation
 * - Uses Next.js Link for client-side navigation
 * - Centers itself in its container
 * 
 * @param {BackPreviousProps} props - Component props
 * @param {string} props.href - Target URL for navigation
 * @param {string} props.label - Button text content
 * 
 * @example
 * ```tsx
 * // Basic usage - navigate to login
 * <BackPrevious
 *   href="/auth/login"
 *   label="Back to login"
 * />
 * 
 * // Navigate to home
 * <BackPrevious
 *   href="/"
 *   label="Return to home"
 * />
 * 
 * // Within auth layout
 * <div className="auth-layout">
 *   <LoginForm />
 *   <BackPrevious
 *     href="/auth/register"
 *     label="Need an account?"
 *   />
 * </div>
 * ```
 */
export function BackPrevious({ href, label }: BackPreviousProps) {
  return (
    <div className="w-full flex justify-center">
      <Button
        variant="link"
        className="font-normal"
        size="sm"
        asChild
      >
        <Link href={href}>
          {label}
        </Link>
      </Button>
    </div>
  );
}

export default BackPrevious;