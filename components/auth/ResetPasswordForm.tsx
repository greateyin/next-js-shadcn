/**
 * @fileoverview Reset password form component
 * @module components/auth/ResetPasswordForm
 * @description Provides a form for users to reset their password with
 * password strength validation and confirmation
 */

"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PasswordStrengthMeter } from "./common/PasswordStrengthMeter";
import zxcvbn from "zxcvbn";

/**
 * Schema for password reset form validation
 * @constant
 * @type {z.ZodObject}
 */
const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Type definition for the reset password form values
 * @typedef {Object} ResetPasswordFormValues
 * @property {string} password - New password
 * @property {string} confirmPassword - Password confirmation
 */
type ResetPasswordFormValues = z.infer<typeof formSchema>;

/**
 * ResetPasswordForm component for password reset functionality
 * @component
 * @description Provides a form for users to reset their password. Includes:
 * - Password strength validation using zxcvbn
 * - Password confirmation matching
 * - Visual password strength indicator
 * - Loading states and error handling
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ResetPasswordForm />
 * 
 * // Within auth card wrapper
 * <AuthCardWrapper
 *   headerLabel="Reset Password"
 *   backButtonLabel="Back to login"
 *   backButtonHref="/auth/login"
 * >
 *   <ResetPasswordForm />
 * </AuthCardWrapper>
 * ```
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isPending, setIsPending] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Handles password input change to calculate strength score
   * @function
   * @param {string} value - Current password value
   */
  const handlePasswordChange = (value: string) => {
    const result = zxcvbn(value);
    setPasswordScore(result.score);
  };

  /**
   * Handles form submission for password reset
   * @async
   * @function
   * @param {ResetPasswordFormValues} values - Form values containing new password
   */
  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("Missing reset token!");
      return;
    }

    try {
      setIsPending(true);

      // Call your reset password API here
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast.success("Password has been reset!");
      router.push("/auth/login");
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder="******"
                    type="password"
                    onChange={(e) => {
                      field.onChange(e);
                      handlePasswordChange(e.target.value);
                    }}
                  />
                </FormControl>
                <PasswordStrengthMeter score={passwordScore} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder="******"
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button disabled={isPending} type="submit" className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>
      </form>
    </Form>
  );
}
