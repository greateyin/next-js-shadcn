/**
 * @fileoverview Forgot Password Page - Auth.js V5 Best Practices
 * @module app/auth/forgot-password/page
 * @description Password reset request page using Server Actions
 */

"use client";

import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AuthCardWrapper } from "@/components/auth/common/AuthCardWrapper";
import { FormError } from "@/components/auth/common/FormError";
import { FormSuccess } from "@/components/auth/common/FormSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/actions/auth/password-reset";
import { toast } from "sonner";

/**
 * Submit button component with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  );
}

/**
 * Forgot Password Page Component
 * @component
 * @description Allows users to request a password reset link via email
 * Following Auth.js V5 best practices with Server Actions
 */
export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordResetAction, undefined);

  // Show toast notifications
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success(state.success);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <AuthCardWrapper
          headerLabel="Forgot Password?"
          backButtonLabel="Back to Login"
          backButtonHref="/auth/login"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter your email address and we'll send you a password reset link.
            </p>
            
            <form action={formAction} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                    autoComplete="email"
                    className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                  />
                </div>
              </div>

              {state?.error && <FormError message={state.error} />}
              {state?.success && <FormSuccess message={state.success} />}

              <SubmitButton />
            </form>
          </div>
        </AuthCardWrapper>
      </div>
    </div>
  );
}
