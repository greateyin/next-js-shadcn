/**
 * @fileoverview Dashboard Help Page
 * @module app/dashboard/help/page
 * @description Help and support page within the dashboard layout
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserMenuItems, type MenuItemWithChildren } from "@/lib/menu";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHelpContent } from "@/components/dashboard/dashboard-help-content";

export const metadata = {
  title: "Help & Support | Dashboard",
  description: "Get help and support for the dashboard",
};

/**
 * Dashboard Help Page Component
 * @component
 * @description Displays help and support information within the dashboard layout
 */
export default async function DashboardHelpPage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/help");
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
      <DashboardHelpContent />
    </DashboardShell>
  );
}

