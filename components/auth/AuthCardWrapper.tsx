/**
 * @fileoverview Authentication card wrapper component
 * @module components/auth/AuthCardWrapper
 * @description Provides a consistent card layout for authentication forms
 * with header, content, social buttons, and navigation
 */

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Social } from "./Social";  // Updated import path
import Link from "next/link";

/**
 * Props for the AuthCardWrapper component
 * @interface
 * @property {React.ReactNode} children - The content to be rendered inside the card
 * @property {string} headerLabel - The text to display in the card header
 * @property {string} backButtonLabel - The text for the back navigation button
 * @property {string} backButtonHref - The URL to navigate to when back button is clicked
 * @property {boolean} [showSocial] - Whether to show social authentication buttons
 */
interface AuthCardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

/**
 * AuthCardWrapper component provides a consistent layout for auth forms
 * @component
 * @description Renders a card with header, content area, social authentication
 * buttons (optional), and a back navigation button. Used to wrap authentication
 * forms like login, register, and password reset.
 * 
 * @param {AuthCardWrapperProps} props - Component props
 * @param {React.ReactNode} props.children - Content to render inside the card
 * @param {string} props.headerLabel - Card header text
 * @param {string} props.backButtonLabel - Back button text
 * @param {string} props.backButtonHref - Back button navigation URL
 * @param {boolean} [props.showSocial] - Show social auth buttons
 * 
 * @example
 * ```tsx
 * // Basic usage for login form
 * <AuthCardWrapper
 *   headerLabel="Sign In"
 *   backButtonLabel="Don't have an account?"
 *   backButtonHref="/auth/register"
 *   showSocial
 * >
 *   <LoginForm />
 * </AuthCardWrapper>
 * 
 * // Usage for register form
 * <AuthCardWrapper
 *   headerLabel="Create an Account"
 *   backButtonLabel="Already have an account?"
 *   backButtonHref="/auth/login"
 *   showSocial
 * >
 *   <RegisterForm />
 * </AuthCardWrapper>
 * ```
 */
export function AuthCardWrapper({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: AuthCardWrapperProps) {
  return (
    <Card className="w-full max-w-[400px] shadow-md">
      <CardHeader>
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
          <h1 className="text-3xl font-semibold">{headerLabel}</h1>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {showSocial && (
        <CardFooter>
          <Social />
        </CardFooter>
      )}
      <CardFooter>
        <Button
          variant="link"
          className="font-normal w-full"
          size="sm"
          asChild
        >
          <Link href={backButtonHref}>
            {backButtonLabel}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
