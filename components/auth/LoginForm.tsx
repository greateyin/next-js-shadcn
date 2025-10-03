/**
 * @fileoverview Login form component with email and password authentication
 * @module components/auth/LoginForm
 */

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
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * Zod schema for login form validation
 * @constant
 * @type {z.ZodObject}
 */
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

/**
 * Type definition for the login form values
 * @typedef {Object} LoginFormValues
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */
type LoginFormValues = z.infer<typeof formSchema>;

/**
 * LoginForm component handles user authentication
 * @component
 * @description Renders a form for user login with email and password fields.
 * Includes form validation, loading states, and error handling.
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Handles form submission for user login
   * @async
   * @param {LoginFormValues} values - Form values containing email and password
   */
  const onSubmit = async (values: LoginFormValues) => {
    setIsPending(true);

    try {
      const response = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: DEFAULT_LOGIN_REDIRECT,
      });

      if (response?.error) {
        toast.error("Invalid credentials");
        return;
      }

      toast.success("Logged in successfully");
      const destination = response?.url || DEFAULT_LOGIN_REDIRECT;
      if (destination.startsWith("/")) {
        router.push(destination);
      } else {
        window.location.href = destination;
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder="john.doe@example.com"
                    type="email"
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
                <FormLabel>Password</FormLabel>
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
        <Button
          disabled={isPending}
          type="submit"
          className="w-full"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>
      </form>
    </Form>
  );
}
