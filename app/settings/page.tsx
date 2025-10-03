import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/settings");
  }

  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      status: true,
      image: true,
      isTwoFactorEnabled: true,
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-6 py-16">
      <div className="space-y-10">
        <div className="space-y-2">
          <Badge className="w-fit bg-emerald-500/15 text-emerald-400">Account controls</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Personalise how your workspace behaves. Updates apply only to you and can be changed at any time.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Manage what appears on your profile card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" defaultValue={account?.name ?? ""} placeholder="Add your name" />
                <p className="text-xs text-muted-foreground">Update how your name appears to collaborators.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" value={account?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">Email is used for login and security alerts.</p>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Profile visibility</p>
              <div className="flex items-center justify-between gap-6">
                <div className="text-sm text-muted-foreground">
                  Show my name and avatar inside community spaces.
                </div>
                <Switch defaultChecked aria-label="Profile visibility" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="button">Save profile</Button>
          </CardFooter>
        </Card>

        <Card id="security">
          <CardHeader>
            <CardTitle>Notifications & security</CardTitle>
            <CardDescription>Choose how we keep you informed and protect your access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="font-medium">Product announcements</p>
                  <p className="text-sm text-muted-foreground">Get occasional tips and launch updates.</p>
                </div>
                <Switch defaultChecked aria-label="Product announcements" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="font-medium">Security emails</p>
                  <p className="text-sm text-muted-foreground">Always notify me when my account is accessed.</p>
                </div>
                <Switch defaultChecked aria-label="Security emails" disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="font-medium">Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">
                    {account?.isTwoFactorEnabled
                      ? "Currently enabled. Disable only if you have another security method in place."
                      : "Add an extra layer of security when signing in."}
                  </p>
                </div>
                <Switch
                  defaultChecked={account?.isTwoFactorEnabled ?? false}
                  aria-label="Two factor toggle"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline">
              Reset preferences
            </Button>
            <Button type="button">Update security</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
