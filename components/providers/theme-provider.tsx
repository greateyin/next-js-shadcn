"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

/**
 * ThemeProvider Component - Provides theme context to the application
 * 
 * This component wraps the application with the next-themes provider
 * to enable theme switching functionality (light/dark/system).
 * 
 * @component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be rendered within the theme context
 * @param {ThemeProviderProps} props - Other theme provider props from next-themes
 * @returns {JSX.Element} The theme provider wrapper
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
