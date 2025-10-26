/**
 * @fileoverview Authentication Server Actions following Auth.js V5 best practices
 * @module actions/auth/login
 * @description Server-side authentication actions with proper error handling and redirects
 */

"use server";

import { signIn, signOut } from "@/auth";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT, ADMIN_LOGIN_REDIRECT } from "@/routes";
import { db } from "@/lib/db";

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
const ADMIN_ROLE_NAMES = new Set(["admin", "super-admin"]);

async function determineRoleBasedRedirect(
  email: string,
  requestedRedirect?: string | null
): Promise<string> {
  if (requestedRedirect && requestedRedirect.length > 0) {
    return requestedRedirect;
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  const hasAdminRole = user.userRoles.some(({ role }) =>
    ADMIN_ROLE_NAMES.has(role.name)
  );

  return hasAdminRole ? ADMIN_LOGIN_REDIRECT : DEFAULT_LOGIN_REDIRECT;
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid credentials" };
  }

  try {
    // ✅ Check if user exists in database BEFORE attempting login
    const userExists = await db.user.findUnique({
      where: { email: validatedFields.data.email }
    });

    if (!userExists) {
      // ✅ User doesn't exist - suggest registration
      return {
        error: "User not found. Please register first.",
        redirectTo: "/auth/register"
      };
    }

    // Check user role BEFORE signing in to determine redirect target
    const redirectTarget = await determineRoleBasedRedirect(
      validatedFields.data.email
    );

    // Auth.js will handle the redirect automatically
    // It will redirect to DEFAULT_LOGIN_REDIRECT or the callbackUrl
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: redirectTarget,
    });
  } catch (error) {
    // Auth.js throws NEXT_REDIRECT error for successful redirects
    // We need to re-throw it so Next.js can handle the redirect
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid password. Please try again." };
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
    // ✅ Check if user exists in database BEFORE attempting login
    const userExists = await db.user.findUnique({
      where: { email: validatedFields.data.email }
    });

    if (!userExists) {
      // ✅ User doesn't exist - suggest registration
      return {
        error: "User not found. Please register first.",
        redirectTo: "/auth/register"
      };
    }

    // If no custom redirect, check user role to determine redirect target
    let finalRedirect = customRedirect;

    if (!finalRedirect) {
      finalRedirect = await determineRoleBasedRedirect(
        validatedFields.data.email
      );
    }

    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: finalRedirect,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid password. Please try again." };
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
 * Login without automatic redirect - for client-side handling
 * 
 * @description
 * Authenticates the user but does NOT automatically redirect.
 * Returns success/error state to allow client-side redirect after cookie is set.
 * This solves the cookie timing issue where middleware can't read newly set cookies.
 * 
 * @param {any} prevState - Previous form state (for useActionState)
 * @param {FormData} formData - Form data containing email and password
 * @returns {Promise<{success?: boolean; error?: string}>} Success or error state
 * 
 * @example
 * ```tsx
 * const [state, formAction] = useActionState(loginNoRedirectAction, undefined);
 * 
 * useEffect(() => {
 *   if (state?.success) {
 *     router.push('/dashboard');
 *     router.refresh();
 *   }
 * }, [state]);
 * ```
 */
export async function loginNoRedirectAction(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; redirectTo?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input
  const validatedFields = LoginSchema.safeParse({
    email,
    password,
  });

  if (!validatedFields.success) {
    return { error: "Invalid credentials format" };
  }

  try {
    // ✅ Check if user exists in database BEFORE attempting login
    const userExists = await db.user.findUnique({
      where: { email: validatedFields.data.email }
    });

    if (!userExists) {
      // ✅ User doesn't exist - suggest registration
      return {
        error: "User not found. Please register first.",
        redirectTo: "/auth/register"
      };
    }

    // Sign in without automatic redirect
    const result = await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,  // ← KEY: Don't auto-redirect
    });

    // Check if signIn returned an error
    if (result?.error) {
      // ✅ User exists but password is wrong
      return { error: "Invalid password. Please try again." };
    }

    const redirectTo = await determineRoleBasedRedirect(
      validatedFields.data.email,
      formData.get("redirectTo") as string | null
    );

    // Return success with recommended redirect target
    return { success: true, redirectTo };
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid password. Please try again." };
        case "CallbackRouteError":
          return { error: "Authentication failed" };
        default:
          return { error: "Something went wrong" };
      }
    }

    return { error: "Something went wrong" };
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
