/**
 * @fileoverview Social login buttons component
 * @module components/auth/Social
 * @description Provides buttons for social authentication using
 * Google and GitHub OAuth providers
 */

"use client";

import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * Social authentication providers type
 * @typedef {('google'|'github')} SocialProvider
 */
type SocialProvider = "google" | "github";

/**
 * Social login component with OAuth provider buttons
 * @component
 * @description Renders buttons for social authentication using
 * Google and GitHub OAuth providers. Each button triggers the
 * corresponding OAuth flow when clicked.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Social />
 * 
 * // Within auth form
 * <AuthForm>
 *   <div>
 *     <h2>Or continue with</h2>
 *     <Social />
 *   </div>
 * </AuthForm>
 * ```
 */
export function Social() {
  /**
   * Handles social login button click
   * @function
   * @param {SocialProvider} provider - The OAuth provider to use
   */
  const onClick = (provider: SocialProvider) => {
    signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    });
  };

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("github")}
      >
        <FaGithub className="h-5 w-5" />
      </Button>
    </div>
  );
}
