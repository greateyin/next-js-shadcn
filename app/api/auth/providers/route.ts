/**
 * @fileoverview Authentication providers route handler
 * @module app/api/auth/providers
 * @description Provides information about available authentication
 * providers and their configurations
 */

import { NextResponse } from "next/server";
import { oauthProviders } from "@/auth.base.config";

/**
 * Force dynamic route handling to ensure provider info is always current
 * @constant
 */
export const dynamic = 'force-dynamic';

/**
 * OAuth provider configuration type
 * @typedef {Object} OAuthProvider
 * @property {string} id - Provider identifier
 * @property {string} name - Display name of the provider
 * @property {string} type - Authentication type (e.g., 'oauth')
 * @property {string} signinUrl - URL for initiating sign-in
 * @property {string} callbackUrl - OAuth callback URL
 */
type OAuthProvider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

/**
 * GET request handler for auth providers
 * @async
 * @function
 * @description Returns configuration for all available
 * authentication providers
 * 
 * @returns {Promise<NextResponse>} JSON response with provider configurations
 * 
 * @example
 * ```ts
 * // Client-side usage
 * const response = await fetch('/api/auth/providers');
 * const data = await response.json();
 * // data = {
 * //   google: {
 * //     id: "google",
 * //     name: "Google",
 * //     type: "oauth",
 * //     signinUrl: "/api/auth/signin/google",
 * //     callbackUrl: "/api/auth/callback/google"
 * //   },
 * //   github: {
 * //     id: "github",
 * //     name: "GitHub",
 * //     type: "oauth",
 * //     signinUrl: "/api/auth/signin/github",
 * //     callbackUrl: "/api/auth/callback/github"
 * //   }
 * // }
 * ```
 * 
 * @throws {Error} If provider configuration cannot be generated
 */
export async function GET() {
  try {
    const providers = oauthProviders.reduce<Record<string, OAuthProvider>>((acc, provider) => {
      acc[provider.id] = {
        id: provider.id,
        name: provider.name ?? provider.id,
        type: provider.type,
        signinUrl: `/api/auth/signin/${provider.id}`,
        callbackUrl: `/api/auth/callback/${provider.id}`
      }
      return acc
    }, {})

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error getting providers:", error);
    return NextResponse.json(
      { error: "Failed to get providers" },
      { status: 500 }
    );
  }
}
