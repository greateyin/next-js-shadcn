/**
 * @fileoverview Social authentication buttons component - Auth.js V5 Best Practices
 * @module components/auth/social-buttons
 * @description Provides buttons for OAuth authentication with
 * various social providers following Auth.js V5 patterns
 * 
 * Note: For OAuth providers, client-side signIn is acceptable and recommended
 * because OAuth requires browser redirects. This is different from credentials
 * authentication which should use Server Actions.
 */

"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useState } from "react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useSearchParams } from "next/navigation";

/**
 * OAuth provider type
 * @typedef {('google'|'github')} OAuthProvider
 * @description Supported OAuth provider names
 */
type OAuthProvider = "google" | "github";

/**
 * SocialButtons component for OAuth authentication
 * @component
 * @description A component that follows Auth.js V5 best practices:
 * - Uses client-side signIn for OAuth (required for browser redirects)
 * - Handles OAuth authentication flow automatically
 * - Shows loading states during authentication
 * - Respects callbackUrl from query params
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
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || DEFAULT_LOGIN_REDIRECT;

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
   * @description Initiates the OAuth flow with the selected provider.
   * 
   * Note: OAuth providers MUST use client-side signIn because:
   * 1. OAuth requires browser redirects to the provider's site
   * 2. The provider needs to redirect back to our callback URL
   * 3. This is different from credentials auth which uses Server Actions
   * 
   * This is the Auth.js V5 recommended approach for OAuth providers.
   */
  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    try {
      setIsLoading((prev) => ({ ...prev, [provider]: true }));
      
      // OAuth sign-in with automatic redirect
      // Auth.js will handle the entire OAuth flow
      await signIn(provider, {
        callbackUrl,
      });
    } catch (error) {
      console.error("OAuth sign in error:", error);
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
