// components/auth/RegisterForm.tsx
/**
 * @fileoverview User registration form component
 * @module components/auth/RegisterForm
 * @description Provides a form for new user registration with
 * validation, error handling, and success feedback
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthCardWrapper } from "@/components/auth/common/AuthCardWrapper";
import { FormError } from "@/components/auth/common/FormError";
import { FormSuccess } from "@/components/auth/common/FormSuccess";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RegisterSchema } from "@/schemas/authSchemas";
import { registerAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Schema for registration form validation
 * @constant
 * @type {z.ZodObject}
 */
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Type definition for the registration form values
 * @typedef {Object} RegisterFormValues
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */
type RegisterFormValues = z.infer<typeof formSchema>;

/**
 * RegisterForm component for user registration
 * @component
 * @description Provides a form for new user registration that includes:
 * - Name, email, and password fields with validation
 * - Loading states and error handling
 * - Success feedback and redirection
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RegisterForm />
 * 
 * // Within auth card wrapper
 * <AuthCardWrapper
 *   headerLabel="Create Account"
 *   backButtonLabel="Already have an account?"
 *   backButtonHref="/auth/login"
 * >
 *   <RegisterForm />
 * </AuthCardWrapper>
 * ```
 */
const RegisterForm: React.FC = () => {
  /** Loading state for form submission */
  const [isLoading, setIsLoading] = useState(false);
  /** Success message to display after successful registration */
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  /** Error message to display if registration fails */
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const router = useRouter();

  /**
   * Form hook initialization with Zod schema validation
   * @type {UseFormReturn<z.infer<typeof RegisterSchema>>}
   */
  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  /**
   * Handles the registration process by calling the register action
   * and managing the response state.
   * 
   * @param {z.infer<typeof RegisterSchema>} values - The form values to submit
   * @returns {Promise<void>}
   */
  const registerHandler = useCallback(async (values: z.infer<typeof RegisterSchema>) => {
    setIsLoading(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const data = await registerAction(values);
      if (data?.error) {
        setErrorMessage(data.error);
      } else if (data?.success) {
        setSuccessMessage(data.success);
        reset();
        // Optionally redirect to login page after successful registration
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    } catch (error) {
      console.error("Register error:", error);
      setErrorMessage("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [reset, router]);

  /**
   * Form submission handler that triggers the registration process
   * @param {z.infer<typeof RegisterSchema>} values - The form values
   */
  const onSubmit = useCallback((values: z.infer<typeof RegisterSchema>) => {
    registerHandler(values);
  }, [registerHandler]);

  /**
   * Effect to automatically clear success/error messages after 5 seconds
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successMessage || errorMessage) {
      timer = setTimeout(() => {
        setSuccessMessage(undefined);
        setErrorMessage(undefined);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  return (
    <AuthCardWrapper
      headerLabel="Create an account"
      backButtonLabel="Already have an account?"
      backButtonHref="/auth/login"
      showSocial
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-2xl font-bold text-primary mb-6">Join Ocean Breeze</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Name"
            disabled={isLoading}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            disabled={isLoading}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            disabled={isLoading}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        {errorMessage && <FormError message={errorMessage} />}
        {successMessage && <FormSuccess message={successMessage} />}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary-light"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create an account'}
        </Button>
      </form>
    </AuthCardWrapper>
  );
};

export default RegisterForm;
