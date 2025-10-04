/**
 * @fileoverview Profile Content Component for Dashboard
 * @module components/dashboard/profile-content
 * @description User profile information display within dashboard layout
 */

import Link from "next/link";
import { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProfileContentProps {
  session: Session;
  accountInfo: {
    createdAt: Date;
    lastSuccessfulLogin: Date | null;
    isTwoFactorEnabled: boolean;
    status: string;
  } | null;
}

/**
 * Profile Content Component
 * @component
 * @description Displays user profile information within the dashboard
 */
export function ProfileContent({ session, accountInfo }: ProfileContentProps) {
  const { user } = session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your account information
            </p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 h-fit">
            Personal Space
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarImage 
                  src={user.image || undefined} 
                  alt={user.name ?? user.email ?? "Avatar"} 
                />
                <AvatarFallback className="text-lg">
                  {user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-semibold">
                  {user.name ?? "Untitled Expert"}
                </CardTitle>
                <CardDescription className="text-base">
                  {user.email}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roleNames?.length ? (
                user.roleNames.map((role) => (
                  <Badge 
                    key={role} 
                    variant="outline" 
                    className="border-border/60 text-muted-foreground capitalize"
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="border-border/60 text-muted-foreground">
                  Member
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Account Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="font-medium capitalize">
                  {accountInfo?.status ?? user.status ?? "active"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Primary Email</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {accountInfo?.createdAt 
                    ? new Date(accountInfo.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="font-medium">
                  {accountInfo?.lastSuccessfulLogin
                    ? new Date(accountInfo.lastSuccessfulLogin).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="default">
                <Link href="/settings">Update Account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings#security">Security Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Security Snapshot */}
          <Card>
            <CardHeader>
              <CardTitle>Security Snapshot</CardTitle>
              <CardDescription>
                Monitor key security details tied to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-muted-foreground">
                  {accountInfo?.isTwoFactorEnabled
                    ? "✅ Enabled. You'll be asked for a code on new devices."
                    : "⚠️ Disabled. Enable it from settings to add extra security."}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="font-medium">Role-Based Access</p>
                <p className="text-muted-foreground">
                  {user.roleNames?.length
                    ? `You have access to ${user.roleNames.join(", ")} features.`
                    : "You have standard member access to your personal tools."}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="font-medium">Applications</p>
                <p className="text-muted-foreground">
                  {user.applicationPaths?.length
                    ? `Active: ${user.applicationPaths.join(", ")}`
                    : "No custom applications assigned yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/settings">Notification Preferences</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/settings#security">Manage Login Security</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/settings#privacy">Privacy Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
