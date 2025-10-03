/**
 * @fileoverview Form error message component
 * @module components/auth/FormError
 * @description Displays error messages in forms with a consistent style and icon
 */

"use client"

import { AlertCircle } from "lucide-react"

/**
 * Props for the FormError component
 * @interface
 * @property {string} [message] - The error message to display
 */
interface FormErrorProps {
  message?: string
}

/**
 * FormError component displays error messages in forms
 * @component
 * @description Renders an error message with an alert icon in a styled container.
 * If no message is provided, the component renders nothing.
 * 
 * @param {FormErrorProps} props - Component props
 * @param {string} [props.message] - The error message to display
 * 
 * @returns {JSX.Element|null} The error message component or null if no message
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <FormError message="Invalid email address" />
 * 
 * // With dynamic error message
 * <FormError message={formState.errors.email?.message} />
 * 
 * // No message (renders nothing)
 * <FormError />
 * ```
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  )
}
