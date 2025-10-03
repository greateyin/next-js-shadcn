"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * ToasterProvider Component - Provides toast notifications to the application
 * 
 * This component sets up the toast notification system with proper theming
 * support for both light and dark modes.
 * 
 * @component
 * @returns {JSX.Element} The toaster provider component
 */
export function ToasterProvider() {
  const { theme } = useTheme();
  
  return (
    <Toaster 
      position="bottom-right"
      theme={theme as "light" | "dark" | undefined}
      closeButton
      richColors
      toastOptions={{
        duration: 4000,
        className: "border border-border rounded-md",
      }}
    />
  );
}