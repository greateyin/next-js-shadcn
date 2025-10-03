/**
 * @fileoverview Form success message component
 * @module components/auth/FormSuccess
 * @description Displays success messages in forms with a consistent style and icon
 */

"use client"

import { CheckCircle2 } from "lucide-react"

/**
 * Props for the FormSuccess component
 * @interface
 * @property {string} [message] - The success message to display
 */
interface FormSuccessProps {
  message?: string
}

/**
 * FormSuccess component displays success messages in forms
 * @component
 * @description Renders a success message with a checkmark icon in a styled container.
 * If no message is provided, the component renders nothing.
 * 
 * @param {FormSuccessProps} props - Component props
 * @param {string} [props.message] - The success message to display
 * 
 * @returns {JSX.Element|null} The success message component or null if no message
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <FormSuccess message="Registration successful!" />
 * 
 * // With dynamic success message
 * <FormSuccess message={formState.successMessage} />
 * 
 * // No message (renders nothing)
 * <FormSuccess />
 * ```
 */
export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null

  return (
    <div className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500">
      <CheckCircle2 className="h-4 w-4" />
      <p>{message}</p>
    </div>
  )
}
