/**
 * Register Page Component - User registration interface
 *
 * This component serves as the registration page of the application.
 * It renders the registration form in a centered layout and provides
 * metadata for SEO optimization.
 *
 * @component
 * @returns {JSX.Element} The registration page with centered form
 */

import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

/**
 * Metadata configuration for the registration page
 * Provides SEO-friendly title and description
 */
export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <RegisterForm />
    </div>
  );
}
