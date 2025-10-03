import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/profile");
  }

  const { user } = session;
  const account = await db.user.findUnique({
    where: { id: user.id },
    select: {
      createdAt: true,
      lastSuccessfulLogin: true,
      isTwoFactorEnabled: true,
      status: true,
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-6 py-16">
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge className="w-fit bg-emerald-500/15 text-emerald-400">Personal space</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
          <p className="text-muted-foreground">
            Review your account details, roles, and recent security activity. Only you can see this page.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={user.image || undefined} alt={user.name ?? user.email ?? "Avatar"} />
                  <AvatarFallback>{user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-semibold">{user.name ?? "Untitled expert"}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.roleNames?.length ? (
                  user.roleNames.map((role) => (
                    <Badge key={role} variant="outline" className="border-border/60 text-muted-foreground">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="border-border/60 text-muted-foreground">
                    member
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Account status</p>
                  <p className="mt-1 font-medium capitalize">{account?.status ?? user.status ?? "active"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Primary email</p>
                  <p className="mt-1 font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="mt-1 font-medium">
                    {account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last successful login</p>
                  <p className="mt-1 font-medium">
                    {account?.lastSuccessfulLogin
                      ? new Date(account.lastSuccessfulLogin).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/settings">Update account</Link>
                </Button>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <a href="mailto:support@example.com">Contact support</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security snapshot</CardTitle>
                <CardDescription>Monitor key security details tied to your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium">Two-factor authentication</p>
                  <p className="mt-1 text-muted-foreground">
                    {account?.isTwoFactorEnabled
                      ? "Enabled. You'll be asked for a code on new devices."
                      : "Disabled. Enable it from settings to add an extra layer of security."}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium">Role-based access</p>
                  <p className="mt-1 text-muted-foreground">
                    {user.roleNames?.length
                      ? `You currently have access to ${user.roleNames.join(", ")} experiences.`
                      : "You have a standard member account with access to your personal tools."}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium">Recent applications</p>
                  <p className="mt-1 text-muted-foreground">
                    {user.applicationPaths?.length
                      ? `Enabled applications: ${user.applicationPaths.join(", ")}.`
                      : "No custom applications assigned yet."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next steps</CardTitle>
                <CardDescription>Stay organised with quick shortcuts tailored to you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/settings">Review notification preferences</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/settings#security">Manage login security</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
