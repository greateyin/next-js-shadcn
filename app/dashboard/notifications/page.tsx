/**
 * @fileoverview Dashboard Notifications Page
 * @module app/dashboard/notifications/page
 * @description Full notifications page within the dashboard layout
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserMenuItems, type MenuItemWithChildren } from "@/lib/menu";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardNotificationsContent } from "@/components/dashboard/dashboard-notifications-content";

export const metadata = {
  title: "Notifications | Dashboard",
  description: "View and manage your notifications",
};

/**
 * Dashboard Notifications Page Component
 * @component
 * @description Displays all notifications within the dashboard layout
 */
export default async function DashboardNotificationsPage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/notifications");
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
      <DashboardNotificationsContent />
    </DashboardShell>
  );
}

