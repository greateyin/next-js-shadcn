"use server"

import { loginWithRedirectAction } from "./login"

/**
 * Wrapper for login action to be used in client components
 * This allows passing callbackUrl from client while keeping server action separate
 */
export async function loginFormAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | undefined
  const sanitizedCallback = callbackUrl && callbackUrl.length > 0 ? callbackUrl : undefined

  // Don't use try-catch - let redirect() throw NEXT_REDIRECT naturally
  await loginWithRedirectAction(formData, sanitizedCallback)
}
