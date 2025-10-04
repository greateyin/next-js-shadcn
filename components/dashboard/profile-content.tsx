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
    <div className="space-y-6 md:space-y-8">
      {/* Header - Apple Style */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
              My Profile
            </h1>
            <p className="text-gray-600 mt-2 text-base">
              View and manage your account information
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 h-fit self-start sm:self-auto shadow-sm">
            Personal Space
          </Badge>
        </div>
      </div>

      {/* Main Content Grid - Apple Style */}
      <div className="grid gap-5 md:gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Profile Card - Apple Style */}
        <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-gray-100 shadow-md">
                <AvatarImage 
                  src={user.image || undefined} 
                  alt={user.name ?? user.email ?? "Avatar"} 
                />
                <AvatarFallback className="text-lg md:text-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl md:text-2xl font-semibold text-gray-900">
                  {user.name ?? "Untitled Expert"}
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
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
                    className="border-blue-200 bg-blue-50/50 text-blue-700 capitalize hover:bg-blue-100/50 transition-colors"
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-700">
                  Member
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Account Details Grid - Apple Style */}
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-500">Account Status</p>
                <p className="font-medium text-gray-900 capitalize">
                  {accountInfo?.status ?? user.status ?? "active"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-500">Primary Email</p>
                <p className="font-medium text-gray-900 break-all">{user.email}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">
                  {accountInfo?.createdAt 
                    ? new Date(accountInfo.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-500">Last Login</p>
                <p className="font-medium text-gray-900">
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

            {/* Action Buttons - Apple Style */}
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm">
                <Link href="/settings">Update Account</Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Link href="/settings#security">Security Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Apple Style */}
        <div className="space-y-5 md:space-y-6">
          {/* Security Snapshot - Apple Style */}
          <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Security Snapshot</CardTitle>
              <CardDescription className="text-gray-600">
                Monitor key security details tied to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-1.5 shadow-sm">
                <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                <p className="text-gray-700 leading-relaxed">
                  {accountInfo?.isTwoFactorEnabled
                    ? "✅ Enabled. You'll be asked for a code on new devices."
                    : "⚠️ Disabled. Enable it from settings to add extra security."}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-1.5 shadow-sm">
                <p className="font-semibold text-gray-900">Role-Based Access</p>
                <p className="text-gray-700 leading-relaxed">
                  {user.roleNames?.length
                    ? `You have access to ${user.roleNames.join(", ")} features.`
                    : "You have standard member access to your personal tools."}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-1.5 shadow-sm">
                <p className="font-semibold text-gray-900">Applications</p>
                <p className="text-gray-700 leading-relaxed">
                  {user.applicationPaths?.length
                    ? `Active: ${user.applicationPaths.join(", ")}`
                    : "No custom applications assigned yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Apple Style */}
          <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button asChild className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700" variant="outline">
                <Link href="/settings">Notification Preferences</Link>
              </Button>
              <Button asChild className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700" variant="outline">
                <Link href="/settings#security">Manage Login Security</Link>
              </Button>
              <Button asChild className="w-full justify-start border-gray-200 hover:bg-gray-50 text-gray-700" variant="outline">
                <Link href="/settings#privacy">Privacy Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
