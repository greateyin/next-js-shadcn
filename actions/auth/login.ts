/**
 * @fileoverview Authentication Server Actions following Auth.js V5 best practices
 * @module actions/auth/login
 * @description Server-side authentication actions with proper error handling and redirects
 */

"use server";

import { signIn, signOut } from "@/auth";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * Login Server Action
 * 
 * @description
 * Handles user authentication using Auth.js V5 Server Actions pattern.
 * This is the recommended approach according to Auth.js documentation:
 * - Uses server-side signIn for better security
 * - Automatic redirect handling by Auth.js
 * - Proper error handling and validation
 * 
 * @param {FormData} formData - Form data containing email and password
 * @returns {Promise<{error?: string}>} Error message if login fails
 * 
 * @example
 * ```tsx
 * <form action={loginAction}>
 *   <input name="email" type="email" />
 *   <input name="password" type="password" />
 *   <button type="submit">Login</button>
 * </form>
 * ```
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input
  const validatedFields = LoginSchema.safeParse({
    email,
    password,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid credentials format",
    };
  }

  try {
    // Auth.js will handle the redirect automatically
    // It will redirect to DEFAULT_LOGIN_REDIRECT or the callbackUrl
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    // Auth.js throws NEXT_REDIRECT error for successful redirects
    // We need to re-throw it so Next.js can handle the redirect
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        case "CallbackRouteError":
          return { error: "Authentication failed" };
        default:
          return { error: "Something went wrong" };
      }
    }
    
    // Re-throw to allow Next.js to handle redirects
    throw error;
  }
}

/**
 * Login with redirect URL Server Action
 * 
 * @description
 * Same as loginAction but accepts a custom redirect URL
 * 
 * @param {FormData} formData - Form data containing email, password, and optional redirectTo
 * @returns {Promise<{error?: string}>} Error message if login fails
 */
export async function loginWithRedirectAction(
  formData: FormData,
  redirectTo?: string
) {
  const email = formData.get("email");
  const password = formData.get("password");
  const customRedirect = redirectTo || (formData.get("redirectTo") as string);

  // Validate input
  const validatedFields = LoginSchema.safeParse({
    email,
    password,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid credentials format",
    };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: customRedirect || DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        case "CallbackRouteError":
          return { error: "Authentication failed" };
        default:
          return { error: "Something went wrong" };
      }
    }
    
    throw error;
  }
}

/**
 * Logout Server Action
 * 
 * @description
 * Handles user logout using Auth.js V5 Server Actions pattern.
 * This is the recommended approach for Auth.js V5:
 * - Server-side session invalidation
 * - Automatic redirect handling
 * - Better security than client-side signOut
 * 
 * @param {string} [redirectTo="/"] - URL to redirect after logout
 * 
 * @example
 * ```tsx
 * <form action={async () => {
 *   "use server"
 *   await logoutAction()
 * }}>
 *   <button type="submit">Logout</button>
 * </form>
 * ```
 */
export async function logoutAction(redirectTo: string = "/") {
  try {
    await signOut({ redirectTo });
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}
