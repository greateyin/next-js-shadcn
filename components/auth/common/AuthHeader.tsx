// components/auth/common/AuthHeader.tsx

/**
 * @fileoverview Authentication header component
 * @module components/auth/common/AuthHeader
 * @description Provides a consistent header for authentication forms
 * with customizable label text
 */

/**
 * Props for the AuthHeader component
 * @interface
 * @property {string} label - Text to display below the main heading
 */
interface AuthHeaderProps {
  label: string;
}

/**
 * AuthHeader component for authentication forms
 * @component
 * @description A header component that:
 * - Displays the application logo/name
 * - Shows a customizable label text
 * - Maintains consistent styling across auth forms
 * 
 * @param {AuthHeaderProps} props - Component props
 * @param {string} props.label - Label text to display
 * 
 * @example
 * ```tsx
 * // Basic usage - login form
 * <AuthHeader label="Welcome back" />
 * 
 * // Register form
 * <AuthHeader label="Create an account" />
 * 
 * // Password reset form
 * <AuthHeader label="Reset your password" />
 * 
 * // Within auth card wrapper
 * <AuthCardWrapper>
 *   <AuthHeader label="Sign in to your account" />
 *   <LoginForm />
 * </AuthCardWrapper>
 * ```
 */
export function AuthHeader({ label }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h1 className="text-3xl font-semibold">
        🔒 Auth
      </h1>
      <p className="text-muted-foreground text-sm">
        {label}
      </p>
    </div>
  );
}

export default AuthHeader;