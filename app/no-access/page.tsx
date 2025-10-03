import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlertIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Access Denied",
  description: "You do not have permission to access this resource",
};

export default async function NoAccessPage() {
  const session = await auth();

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <ShieldAlertIcon className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            The page you are trying to access requires specific permissions that
            your account doesn&apos;t have.
          </p>
          <p className="mt-2">
            If you believe you should have access to this resource, please
            contact your administrator.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button asChild>
            <Link href="/profile">Go to Profile</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
