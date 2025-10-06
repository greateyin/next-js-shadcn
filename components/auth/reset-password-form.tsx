/**
 * @fileoverview Reset Password Form Component - Auth.js V5 Best Practices
 * @module components/auth/reset-password-form
 * @description Password reset form using Server Actions with password strength validation
 */

"use client";

import { useEffect, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/common/FormError";
import { FormSuccess } from "@/components/auth/common/FormSuccess";
import { resetPasswordWithTokenAction } from "@/actions/auth/password-reset";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

/**
 * Submit button component with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Resetting..." : "Reset Password"}
    </Button>
  );
}

/**
 * Password strength indicator component
 * @param {Object} props - Component props
 * @param {string} props.password - Password to evaluate
 */
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const widthPercentage = (strength / 5) * 100;
  
  const getColor = () => {
    if (strength < 2) return "bg-red-500";
    if (strength < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getLabel = () => {
    if (strength < 2) return "Weak";
    if (strength < 4) return "Medium";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password Strength: {getLabel()}
      </p>
    </div>
  );
}

/**
 * Reset Password Form Component
 * @component
 * @description Allows users to set a new password using a reset token
 * Following Auth.js V5 best practices with Server Actions
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction] = useActionState(resetPasswordWithTokenAction, undefined);

  // Redirect to login on success
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  if (!token) {
    return (
      <div className="text-center">
        <FormError message="Missing reset token! Please check your email link." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <p className="text-sm text-muted-foreground">
          Please enter your new password
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="token" value={token} />
        
        <div className="space-y-4">
          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <PasswordStrength password={password} />
            <p className="text-xs text-muted-foreground">
              Password must contain at least 8 characters, including uppercase, lowercase and numbers
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {state?.error && <FormError message={state.error} />}
        {state?.success && <FormSuccess message={state.success} />}

        <SubmitButton />
      </form>
    </div>
  );
}
