import { Metadata } from "next";
import { AuthCardWrapper } from "@/components/auth/common/AuthCardWrapper";
import { LoginForm } from "@/components/auth/login-form";

/**
 * Metadata configuration for the Login page
 * Defines SEO-related information
 */
export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

/**
 * LoginPage Component - User authentication page
 *
 * This component renders the login page of the application.
 * It provides a centered layout with:
 * - Welcome message
 * - Login form
 * - Navigation link to registration
 *
 * @component
 * @returns {JSX.Element} The rendered login page
 */
export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <AuthCardWrapper
          headerLabel="Welcome back"
          backButtonLabel="Don't have an account? Sign up"
          backButtonHref="/auth/register"
          showSocial
        >
          <LoginForm />
        </AuthCardWrapper>
      </div>
    </div>
  );
}
