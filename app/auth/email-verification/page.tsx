// app/auth/email-verification/page.tsx

/**
 * Email Verification Page Component
 *
 * This page handles the email verification process for user accounts. It:
 * - Checks for the presence of an email verification token in the URL
 * - Renders the email verification form if token is present
 * - Redirects to login if token is missing
 */

"use client";

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm"

export default function EmailVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-gray-600">Loading...</div>}>
          <EmailVerificationForm token={token} />
        </Suspense>
      </div>
    </div>
  );
}