/**
 * @fileoverview Dashboard Settings Content Component
 * @module components/dashboard/dashboard-settings-content
 * @description Settings management for dashboard preferences
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Lock, Eye, Palette } from "lucide-react";

/**
 * Dashboard Settings Content Component
 * @component
 * @description Displays dashboard settings with multiple tabs
 */
export function DashboardSettingsContent() {
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    systemNotifications: true,
    activityDigest: true,
    digestFrequency: "daily",
    
    // Privacy Settings
    profileVisibility: "private",
    showOnlineStatus: false,
    allowMentions: true,
    
    // Display Settings
    theme: "system",
    compactMode: false,
    sidebarCollapsed: false,
    
    // Security Settings
    sessionTimeout: 30,
    requirePasswordChange: false,
    twoFactorRequired: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      // In a real app, this would save to the backend
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
          Dashboard Settings
        </h1>
        <p className="text-gray-600">
          Customize your dashboard experience and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about dashboard activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(value) => handleSettingChange("emailNotifications", value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">System Notifications</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Show notifications in the dashboard
                  </p>
                </div>
                <Switch
                  checked={settings.systemNotifications}
                  onCheckedChange={(value) => handleSettingChange("systemNotifications", value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Activity Digest</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive a summary of your activities
                  </p>
                </div>
                <Switch
                  checked={settings.activityDigest}
                  onCheckedChange={(value) => handleSettingChange("activityDigest", value)}
                />
              </div>
              {settings.activityDigest && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="digest-freq" className="text-base font-medium">
                      Digest Frequency
                    </Label>
                    <select
                      id="digest-freq"
                      value={settings.digestFrequency}
                      onChange={(e) => handleSettingChange("digestFrequency", e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your information and interact with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="profile-vis" className="text-base font-medium">
                  Profile Visibility
                </Label>
                <select
                  id="profile-vis"
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange("profileVisibility", e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private (Only you)</option>
                  <option value="team">Team (Your team members)</option>
                  <option value="public">Public (Everyone)</option>
                </select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Show Online Status</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(value) => handleSettingChange("showOnlineStatus", value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Allow Mentions</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow others to mention you in comments
                  </p>
                </div>
                <Switch
                  checked={settings.allowMentions}
                  onCheckedChange={(value) => handleSettingChange("allowMentions", value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize how the dashboard looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="theme" className="text-base font-medium">
                  Theme
                </Label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Compact Mode</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Use a more compact layout
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(value) => handleSettingChange("compactMode", value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Collapse Sidebar by Default</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Start with the sidebar collapsed
                  </p>
                </div>
                <Switch
                  checked={settings.sidebarCollapsed}
                  onCheckedChange={(value) => handleSettingChange("sidebarCollapsed", value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your security preferences and session settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="session-timeout" className="text-base font-medium">
                  Session Timeout (minutes)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min="5"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Automatically log out after this period of inactivity
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Require Password Change</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Force password change on next login
                  </p>
                </div>
                <Switch
                  checked={settings.requirePasswordChange}
                  onCheckedChange={(value) => handleSettingChange("requirePasswordChange", value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Require 2FA</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Require two-factor authentication for all logins
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorRequired}
                  onCheckedChange={(value) => handleSettingChange("twoFactorRequired", value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

