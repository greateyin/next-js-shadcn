/**
 * @fileoverview Login form component - Auth.js V5 Best Practices
 * @module components/auth/login-form
 * @description Provides a form for user authentication with
 * email/password and social login options using Server Actions
 */

"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loginWithRedirectAction } from "@/actions/auth";
import { FormError } from "@/components/auth/common/FormError";
import { FormSuccess } from "@/components/auth/common/FormSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialButtons } from "@/components/auth/social-buttons";

/**
 * Submit button component with loading state
 * Uses useFormStatus hook to track form submission
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Logging in..." : "Login"}
    </Button>
  );
}

/**
 * LoginForm component for user authentication
 * @component
 * @description A form component that follows Auth.js V5 best practices:
 * - Uses Server Actions instead of client-side signIn()
 * - Client-side redirect after login to ensure cookie is set
 * - Better security (credentials never exposed to client)
 * - Fixes cookie timing issue with middleware
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
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return (
    <div className="space-y-6">
      <SocialButtons />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/80 px-2 text-gray-600">
            Or continue with
          </span>
        </div>
      </div>

      <form 
        action={async (formData) => {
          'use server'
          const redirect = callbackUrl || "/dashboard";
          formData.append("redirectTo", redirect);
          // ✅ 不使用 try-catch - 讓 redirect() 自然拋出 NEXT_REDIRECT
          await loginWithRedirectAction(formData, redirect);
        }} 
        className="space-y-6"
      >
        <div className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
          />
          <div className="space-y-2">
            <Input
              name="password"
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
            />
            <div className="flex justify-end">
              <a
                href="/auth/forgot-password"
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                Forgot Password?
              </a>
            </div>
          </div>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
