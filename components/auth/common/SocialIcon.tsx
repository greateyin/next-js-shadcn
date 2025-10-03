/**
 * @fileoverview Social authentication icons component
 * @module components/auth/common/SocialIcon
 * @description Provides a grid of social authentication provider
 * icons with OAuth sign-in functionality
 */

"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * OAuth provider type
 * @typedef {('google'|'github')} OAuthProvider
 */
type OAuthProvider = "google" | "github";

/**
 * SocialIcon component for OAuth authentication
 * @component
 * @description A component that:
 * - Displays social authentication provider icons
 * - Handles OAuth sign-in flow
 * - Provides error handling for OAuth process
 * - Redirects to dashboard on successful auth
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SocialIcon />
 * 
 * // Within auth form
 * <AuthForm>
 *   <div>
 *     <h2>Or continue with</h2>
 *     <SocialIcon />
 *   </div>
 * </AuthForm>
 * 
 * // With custom styling
 * <div className="auth-providers">
 *   <SocialIcon />
 * </div>
 * ```
 */
export function SocialIcon() {
  /**
   * Handles OAuth sign-in process
   * @async
   * @function
   * @param {OAuthProvider} provider - The OAuth provider to use
   */
  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    try {
      await signIn(provider, undefined, {
        callbackUrl: DEFAULT_LOGIN_REDIRECT,
      });
    } catch (error) {
      console.error("OAuth sign in error:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-x-2">
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => handleOAuthSignIn("google")}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => handleOAuthSignIn("github")}
      >
        <FaGithub className="h-5 w-5" />
      </Button>
    </div>
  );
}
