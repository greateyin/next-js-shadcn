/**
 * @fileoverview User registration form component
 * @module components/auth/register-form
 * @description Provides a form for new user registration with
 * validation, error handling, and success feedback
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/auth/common/FormError";
import { FormSuccess } from "@/components/auth/common/FormSuccess";
import { registerAction } from "@/actions/auth";

/**
 * Form validation schema
 * @constant
 * @type {z.ZodObject}
 */
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters long",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

/**
 * Type for form field values
 * @typedef {z.infer<typeof formSchema>} FormValues
 */
type FormValues = z.infer<typeof formSchema>;

/**
 * RegisterForm component for user registration
 * @component
 * @description A form component that:
 * - Handles new user registration
 * - Validates form inputs using Zod
 * - Shows validation errors in real-time
 * - Displays API errors and success messages
 * - Manages loading states during submission
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RegisterForm />
 * 
 * // Within auth layout
 * <AuthLayout>
 *   <AuthHeader label="Create an account" />
 *   <RegisterForm />
 *   <BackButton
 *     href="/auth/login"
 *     label="Already have an account?"
 *   />
 * </AuthLayout>
 * 
 * // With custom error handling
 * <div className="auth-container">
 *   <RegisterForm />
 *   <FormError message={apiError} />
 * </div>
 * ```
 */
export function RegisterForm() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  /**
   * Form instance with validation
   * @constant
   * @type {UseFormReturn<FormValues>}
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  /**
   * Handles form submission
   * @async
   * @function
   * @param {FormValues} values - Form field values
   */
  const onSubmit = async (values: FormValues) => {
    try {
      setError(undefined);
      setSuccess(undefined);
      setIsPending(true);

      // Call the registration API
      const response = await registerAction(values);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess(response.success);
    } catch (error) {
      setError("Something went wrong!");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Doe"
                      disabled={isPending}
                      type="text"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="john.doe@example.com"
                      disabled={isPending}
                      type="email"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="******"
                      disabled={isPending}
                      type="password"
                      className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}