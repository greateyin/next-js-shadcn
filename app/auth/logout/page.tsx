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
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Logging out...</p>
    </div>
  );
};

export default LogoutPage;
