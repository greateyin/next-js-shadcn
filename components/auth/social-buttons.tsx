/**
 * @fileoverview Social authentication buttons component
 * @module components/auth/social-buttons
 * @description Provides buttons for OAuth authentication with
 * various social providers like Google and GitHub
 */

"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useState } from "react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * OAuth provider type
 * @typedef {('google'|'github')} OAuthProvider
 * @description Supported OAuth provider names
 */
type OAuthProvider = "google" | "github";

/**
 * SocialButtons component for OAuth authentication
 * @component
 * @description A component that:
 * - Provides buttons for social login providers
 * - Handles OAuth authentication flow
 * - Shows loading states during authentication
 * - Manages error states
 * - Supports multiple providers (Google, GitHub)
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SocialButtons />
 * 
 * // Within login form
 * <LoginForm>
 *   <div className="or-divider">Or continue with</div>
 *   <SocialButtons />
 * </LoginForm>
 * 
 * // Within register form
 * <RegisterForm>
 *   <SocialButtons />
 *   <p className="text-sm text-center">
 *     By signing up, you agree to our Terms
 *   </p>
 * </RegisterForm>
 * ```
 */
export function SocialButtons() {
  /**
   * State to track the loading status of each OAuth provider
   * @type {Record<OAuthProvider, boolean>}
   */
  const [isLoading, setIsLoading] = useState<Record<OAuthProvider, boolean>>({
    google: false,
    github: false,
  });

  /**
   * Handles OAuth sign-in process
   * @async
   * @function
   * @param {OAuthProvider} provider - The OAuth provider to use
   * @description Initiates the OAuth flow with the selected provider,
   * handles loading states and redirects to the callback URL
   */
  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    try {
      /**
       * Update the loading state for the selected provider
       */
      setIsLoading((prev) => ({ ...prev, [provider]: true }));
      
      /**
       * Initiate the OAuth sign-in process with the selected provider
       * Note: For OAuth providers, we can safely use redirect:true as they 
       * don't cause the NEXT_REDIRECT issue in API route handlers
       */
      await signIn(provider, {
        callbackUrl: DEFAULT_LOGIN_REDIRECT,
      });
    } catch (error) {
      /**
       * Log any errors that occur during the OAuth sign-in process
       */
      console.error("OAuth sign in error:", error);
    } finally {
      /**
       * Reset the loading state for the selected provider
       */
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/**
       * Google OAuth button
       */}
      <Button
        variant="outline"
        disabled={isLoading.google}
        onClick={() => handleOAuthSignIn("google")}
      >
        {isLoading.google ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
      {/**
       * GitHub OAuth button
       */}
      <Button
        variant="outline"
        disabled={isLoading.github}
        onClick={() => handleOAuthSignIn("github")}
      >
        {isLoading.github ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>
    </div>
  );
}
