/**
 * Reset Password Page Component - Password reset interface
 *
 * This component renders the password reset page of the application.
 * It provides a centered layout with:
 * - Reset password form
 * - Descriptive header and subtext
 * - Loading state handling
 *
 * @component
 * @returns {JSX.Element} The rendered password reset page
 */

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function NewPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
