// app/auth/layout.tsx
/**
 * Authentication Layout Component - Provides a consistent layout for authentication pages
 *
 * This component serves as a wrapper for all authentication-related pages (login, register, etc.).
 * It provides a centered layout with a theme toggle in the top-right corner.
 *
 * @component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be rendered within the auth layout
 * @returns {JSX.Element} The authentication page layout structure
 */
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Props interface for the AuthLayout component
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;