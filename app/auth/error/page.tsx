import React, { Suspense } from "react";
import AuthErrorForm from "@/components/auth/AuthErrorForm";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The AuthErrorPage component renders an authentication error form wrapped in a Suspense component.
 * It displays a loading message while the AuthErrorForm component is being loaded.
 * 
 * @component
 * @example
 * return (
 *   <AuthErrorPage />
 * )
 */
const AuthErrorPage: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardContent>
                    <Suspense fallback={
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    }>
                        <AuthErrorForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthErrorPage;
