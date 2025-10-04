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
      {pending ? "發送中..." : "發送重置連結"}
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
    <AuthCardWrapper
      headerLabel="忘記密碼？"
      backButtonLabel="返回登入"
      backButtonHref="/auth/login"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          輸入您的電子郵件地址，我們將發送密碼重置連結給您。
        </p>
        
        <form action={formAction} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {state?.error && <FormError message={state.error} />}
          {state?.success && <FormSuccess message={state.success} />}

          <SubmitButton />
        </form>
      </div>
    </AuthCardWrapper>
  );
}
