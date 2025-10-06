/**
 * @fileoverview Back navigation button component
 * @module components/auth/common/BackButton
 * @description Provides a consistent back navigation button
 * used across authentication forms
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Props for the BackButton component
 * @interface
 * @property {string} href - URL to navigate to when clicked
 * @property {string} label - Text to display on the button
 */
interface BackButtonProps {
  href: string;
  label: string;
}

/**
 * BackButton component for navigation between auth forms
 * @component
 * @description A button component that:
 * - Provides consistent styling for back navigation
 * - Uses Next.js Link for client-side navigation
 * - Maintains the auth flow user experience
 * 
 * @param {BackButtonProps} props - Component props
 * @param {string} props.href - Target URL for navigation
 * @param {string} props.label - Button text content
 * 
 * @example
 * ```tsx
 * // Basic usage - navigate to login
 * <BackButton
 *   href="/auth/login"
 *   label="Back to login"
 * />
 * 
 * // Navigate to register
 * <BackButton
 *   href="/auth/register"
 *   label="Don't have an account?"
 * />
 * 
 * // Within auth card wrapper
 * <AuthCardWrapper>
 *   <LoginForm />
 *   <BackButton
 *     href="/auth/register"
 *     label="Create an account"
 *   />
 * </AuthCardWrapper>
 * ```
 */
export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Button
      variant="link"
      className="font-normal w-full text-gray-600 hover:text-gray-900"
      size="sm"
      asChild
    >
      <Link href={href}>
        {label}
      </Link>
    </Button>
  );
}