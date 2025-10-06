import { Metadata } from "next";
import { AuthCardWrapper } from "@/components/auth/common/AuthCardWrapper";
import { RegisterForm } from "@/components/auth/register-form";

/**
 * Metadata configuration for the Register page
 * Defines SEO-related information
 */
export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

/**
 * RegisterPage Component - User registration page
 *
 * This component renders the registration page of the application.
 * It provides a centered layout with:
 * - Welcome message
 * - Registration form
 * - Navigation link to login
 *
 * @component
 * @returns {JSX.Element} The rendered registration page
 */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <AuthCardWrapper
          headerLabel="Create an account"
          backButtonLabel="Already have an account? Login"
          backButtonHref="/auth/login"
        >
          <RegisterForm />
        </AuthCardWrapper>
      </div>
    </div>
  );
}
