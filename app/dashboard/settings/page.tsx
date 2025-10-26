/**
 * @fileoverview Dashboard Settings Page
 * @module app/dashboard/settings/page
 * @description User settings page within the dashboard layout
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserMenuItems, type MenuItemWithChildren } from "@/lib/menu";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSettingsContent } from "@/components/dashboard/dashboard-settings-content";

export const metadata = {
  title: "Settings | Dashboard",
  description: "Manage your dashboard settings and preferences",
};

/**
 * Dashboard Settings Page Component
 * @component
 * @description Displays user settings within the dashboard layout
 */
export default async function DashboardSettingsPage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/settings");
  }

  // Get user's menu items based on their roles with error handling
  let menuItems: MenuItemWithChildren[] = [];
  try {
    menuItems = await getUserMenuItems(session.user.id);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    // Continue with empty menu items instead of crashing
  }

  return (
    <DashboardShell menuItems={menuItems}>
      <DashboardSettingsContent />
    </DashboardShell>
  );
}

