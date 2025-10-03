"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';

const ERROR_MESSAGES = {
    AccessDenied: "Access Denied. Please contact support. Or try logging with Email and password.",
    OAuthAccountNotLinked: "Another account already exists with the same e-mail address. Please try logging in with a different provider.",
    default: "Oops something went wrong!"
};

const getErrorMessage = (error: string | null) => {
    return error ? (ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default) : ERROR_MESSAGES.default;
};

interface AuthErrorFormProps {
    defaultError?: string;
}

const AuthErrorForm: React.FC<AuthErrorFormProps> = ({ defaultError = ERROR_MESSAGES.default }) => {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(defaultError);

    useEffect(() => {
        const errorParam = searchParams?.get("error");
        setError(errorParam ?? defaultError);
    }, [searchParams, defaultError]);

    if (!error) return null;

    return (
        <div className="error-container">
            <p className="error-message">{getErrorMessage(error)}</p>
        </div>
    );
};

export default AuthErrorForm;