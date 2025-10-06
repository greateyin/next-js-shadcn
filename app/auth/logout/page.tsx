// /app/auth/logout/page.tsx

"use client";

/**
 * Logout Page Component
 *
 * A client-side component that handles user logout functionality. It:
 * - Automatically triggers the logout process on mount
 * - Uses NextAuth's signOut function to clear the session
 * - Handles error cases during the logout process
 * - Redirects to the home page after successful logout
 *
 * @component
 * @clientComponent
 * @returns {JSX.Element} The logout page component
 */

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut({ redirect: false });
        router.push("/");
      } catch (error) {
        console.error("Logout failed:", error);
        router.push("/auth/error?error=LogoutFailed");
      }
    };

    handleSignOut();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <div className="text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
        <p className="text-gray-600">登出中...</p>
      </div>
    </div>
  );
};

export default LogoutPage;
