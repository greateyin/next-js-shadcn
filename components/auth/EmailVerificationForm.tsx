/**
 * @fileoverview Email verification form component
 * @module components/auth/EmailVerificationForm
 * @description Handles email verification process and provides UI for
 * verification status and resend functionality
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCardWrapper } from "@/components/auth/AuthCardWrapper";
import { FormSuccess } from "@/components/auth/FormSuccess";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { resendVerificationEmail } from "@/actions/auth";

/**
 * Props for the EmailVerificationForm component
 * @interface
 * @property {string} token - Verification token from the email link
 */
interface EmailVerificationFormProps {
  token: string;
}

/**
 * EmailVerificationForm component handles email verification process
 * @component
 * @description Provides a form for email verification that:
 * - Automatically verifies the token on mount
 * - Shows loading, success, and error states
 * - Allows users to resend verification email
 * - Prevents duplicate verification attempts
 * 
 * @param {EmailVerificationFormProps} props - Component props
 * @param {string} props.token - Verification token to validate
 * 
 * @example
 * ```tsx
 * // Basic usage with token from URL
 * <EmailVerificationForm token={token} />
 * 
 * // Within auth card wrapper
 * <AuthCardWrapper
 *   headerLabel="Verify Email"
 *   backButtonLabel="Back to login"
 *   backButtonHref="/auth/login"
 * >
 *   <EmailVerificationForm token={token} />
 * </AuthCardWrapper>
 * ```
 */
export function EmailVerificationForm({ token }: EmailVerificationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const verificationAttempted = useRef(false);

  /**
   * Handles verification token validation
   * @async
   * @function
   * @description Verifies the email token and updates the UI accordingly
   */
  const verifyEmail = useCallback(async () => {
    if (!token || verificationAttempted.current) {
      setError(!token ? "Missing token!" : null);
      setIsPending(false);
      return;
    }

    try {
      verificationAttempted.current = true;
      setIsPending(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
      const data = await response.json();


      if (!response.ok) {
        if (data.error === "Invalid token") {
          setError("The verification link is invalid or has already been used.");
        } else if (data.error === "Token expired") {
          setError("Token expired!");
        } else {
          setError(data.error || "Failed to verify email");
        }
        return;
      }

      setSuccess(data.success || "Email verified successfully! You can now log in.");
    } catch (err) {
      console.error("Error during verification:", err);
      setError("Something went wrong during verification. Please try again later.");
    } finally {
      setIsPending(false);
    }
  }, [token]);

  /**
   * Handles resending verification email
   * @async
   * @function
   * @description Triggers resend of verification email and handles UI states
   */
  const handleResendVerification = async () => {
    if (!token || isPending) {
      return;
    }

    try {
      setIsPending(true);
      setError(null);
      setSuccess(null);

      const response = await resendVerificationEmail(token);
      if (response?.error) {
        setError(response.error);
      }
      if (response?.success) {
        setSuccess(response.success);
      }
    } catch (err) {
      setError("Something went wrong!");
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  return (
    <AuthCardWrapper
      headerLabel="Email Verification"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
    >
      <div className="flex flex-col items-center justify-center w-full">
        {isPending && (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        )}
        {!isPending && success && (
          <FormSuccess message={success} />
        )}
        {!isPending && error && (
          <>
            <FormError message={error} />
            {error === "Token expired!" && (
              <Button
                onClick={handleResendVerification}
                className="mt-4"
                disabled={isPending}
              >
                Resend verification email
              </Button>
            )}
          </>
        )}
      </div>
    </AuthCardWrapper>
  );
}
