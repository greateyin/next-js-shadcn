"use server"

import { loginWithRedirectAction } from "./login"
import { redirect } from "next/navigation"

/**
 * Wrapper for login action to be used in client components
 * This allows passing callbackUrl from client while keeping server action separate
 *
 * ✅ Handles error responses:
 * - User not found: Redirect to /auth/register with error message
 * - Invalid password: Redirect back to /auth/login with error message
 * - Other errors: Redirect back to /auth/login with error message
 */
export async function loginFormAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | undefined
  const sanitizedCallback = callbackUrl && callbackUrl.length > 0 ? callbackUrl : undefined

  // Call login action and handle errors
  const result = await loginWithRedirectAction(formData, sanitizedCallback)

  // If there's an error, redirect with error message
  if (result?.error) {
    // ✅ If user not found, redirect to register page
    if (result.error.includes("User not found")) {
      redirect(`/auth/register?error=${encodeURIComponent(result.error)}`)
    }

    // Otherwise, redirect back to login with error
    redirect(`/auth/login?error=${encodeURIComponent(result.error)}`)
  }

  // If successful, the redirect happens in loginWithRedirectAction
}
