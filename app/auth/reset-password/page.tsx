/**
 * Reset Password Page Component - Auth.js V5 Best Practices
 * @module app/auth/reset-password/page
 * @description Password reset interface using Server Actions
 *
 * This component renders the password reset page of the application.
 * It provides a centered layout with:
 * - Reset password form with password strength validation
 * - Server Actions for secure password reset
 * - Loading state handling
 *
 * @component
 * @returns {JSX.Element} The rendered password reset page
 */

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AuthCardWrapper } from '@/components/auth/common/AuthCardWrapper';

export default function NewPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center">載入中...</div>}>
          <AuthCardWrapper
            headerLabel="重置密碼"
            backButtonLabel="返回登入"
            backButtonHref="/auth/login"
          >
            <ResetPasswordForm />
          </AuthCardWrapper>
        </Suspense>
      </div>
    </div>
  );
}
