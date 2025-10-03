"use client";

import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Icons } from "@/components/icons";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

/**
 * Social Component - Social login buttons for authentication
 * 
 * This component provides buttons for social login options (Google and GitHub)
 * with loading states and error handling.
 * 
 * @component
 * @returns {JSX.Element} The social login buttons
 */
export function Social() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false,
  });

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [provider]: true }));
      await signIn(provider, { callbackUrl: DEFAULT_LOGIN_REDIRECT });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="flex w-full gap-x-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => handleSignIn("google")}
        disabled={isLoading.google}
      >
        {isLoading.google ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <FcGoogle className="h-5 w-5" />
        )}
      </Button>
      <Button
        type="button"
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => handleSignIn("github")}
        disabled={isLoading.github}
      >
        {isLoading.github ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <FaGithub className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
