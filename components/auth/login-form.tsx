/**
 * @fileoverview Login form component
 * @module components/auth/login-form
 * @description Provides a form for user authentication with
 * email/password and social login options
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react"; // Use client-side signIn
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/auth/common/FormError";
import { FormSuccess } from "@/components/auth/common/FormSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * LoginForm component for user authentication
 * @component
 * @description A form component that:
 * - Handles email/password authentication
 * - Provides social login options
 * - Shows loading states during authentication
 * - Displays success/error messages
 * - Redirects after successful login
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LoginForm />
 * 
 * // Within auth layout
 * <AuthLayout>
 *   <AuthHeader label="Welcome back" />
 *   <LoginForm />
 *   <BackButton
 *     href="/auth/register"
 *     label="Need an account?"
 *   />
 * </AuthLayout>
 * ```
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || DEFAULT_LOGIN_REDIRECT;
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  /**
   * Handles form submission for login
   * @async
   * @function
   * @param {React.FormEvent<HTMLFormElement>} e - Form submit event
   */
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError(undefined);
      setSuccess(undefined);
      setIsPending(true);

      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("credentials signIn response", response);
      }

      if (response?.error) {
        setError(response.error || "Authentication failed");
        toast.error("Login failed: " + (response.error || "Unknown error"));
        return;
      }

      setSuccess("Login successful!");
      toast.success("Login successful!");

      const nextUrl = response?.url || callbackUrl || DEFAULT_LOGIN_REDIRECT;

      // Ensure navigation works for both relative and absolute callback URLs.
      if (nextUrl.startsWith("/")) {
        router.push(nextUrl);
        router.refresh();
      } else {
        if (typeof window !== "undefined") {
          window.location.href = nextUrl;
        }
      }

    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong!");
      toast.error("Error during login");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <SocialButtons />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            disabled={isPending}
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            disabled={isPending}
          />
        </div>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Loading..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
