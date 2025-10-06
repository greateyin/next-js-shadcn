// app/auth/layout.tsx
/**
 * Authentication Layout Component - Provides a consistent layout for authentication pages
 *
 * This component serves as a wrapper for all authentication-related pages (login, register, etc.).
 * It provides a modern, centered layout with gradient background inspired by the admin design.
 *
 * @component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be rendered within the auth layout
 * @returns {JSX.Element} The authentication page layout structure
 */
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/providers/theme-provider";

/**
 * Props interface for the AuthLayout component
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-gray-200/30 to-gray-300/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-gray-200/30 to-gray-300/20 blur-3xl" />
        </div>

        {/* Theme toggle */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AuthLayout;