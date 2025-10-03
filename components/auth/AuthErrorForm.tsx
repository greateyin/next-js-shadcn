"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Props interface for the AuthErrorForm component
 * @interface
 * @property {string} [defaultError] - Default error message to display if no error code is provided
 */
interface AuthErrorFormProps {
    defaultError?: string;
}

/**
 * Maps authentication error codes to human-readable messages
 * @function
 * @param {string} error - The error code from the authentication process
 * @returns {string} A user-friendly error message
 */
const getErrorMessage = (error: string): string => {
    switch (error) {
        case "Configuration":
            return "There is a problem with the server configuration.";
        case "AccessDenied":
            return "You do not have permission to sign in.";
        case "Verification":
            return "The verification link has expired or has already been used.";
        case "OAuthSignin":
            return "Error in constructing an authorization URL.";
        case "OAuthCallback":
            return "Error in handling the response from an OAuth provider.";
        case "OAuthCreateAccount":
            return "Could not create OAuth provider user in the database.";
        case "EmailCreateAccount":
            return "Could not create email provider user in the database.";
        case "Callback":
            return "Error in the OAuth callback handler route.";
        case "OAuthAccountNotLinked":
            return "Email on the account already exists with different provider.";
        case "EmailSignin":
            return "Check your email address.";
        case "CredentialsSignin":
            return "Sign in failed. Check the details you provided are correct.";
        case "SessionRequired":
            return "Please sign in to access this page.";
        default:
            return "An unexpected error occurred. Please try again later.";
    }
};

/**
 * AuthErrorForm component displays authentication-related error messages
 * @component
 * @description Renders an alert component that shows authentication error messages.
 * It can handle both URL-based error codes and default error messages.
 * 
 * @param {AuthErrorFormProps} props - Component props
 * @param {string} [props.defaultError="An unknown error occurred"] - Default error message
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AuthErrorForm />
 * 
 * // With custom default error
 * <AuthErrorForm defaultError="Authentication failed" />
 * ```
 */
const AuthErrorForm: React.FC<AuthErrorFormProps> = ({ defaultError = "An unknown error occurred" }) => {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(defaultError);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams) {
            const errorParam = searchParams.get("error");
            setErrorCode(errorParam);
            setError(errorParam ? getErrorMessage(errorParam) : defaultError);
        }
    }, [searchParams, defaultError]);

    if (!error) return null;

    return (
        <div className="space-y-6">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex justify-center space-x-4">
                <Button asChild variant="outline">
                    <Link href="/auth/login">
                        Back to Login
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/">
                        Go to Home
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export default AuthErrorForm;