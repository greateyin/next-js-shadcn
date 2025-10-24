/**
 * @fileoverview Dashboard Page
 * @module app/dashboard/page
 * @description Main dashboard page with dynamic menu based on user roles
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserMenuItems, type MenuItemWithChildren } from "@/lib/menu";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata = {
  title: "Dashboard",
  description: "Dashboard overview",
};

/**
 * Dashboard Page Component
 * @component
 * @description Main dashboard page with role-based dynamic menu
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  // Get dashboard application ID
  const dashboardApp = await db.application.findUnique({
    where: { name: 'dashboard' }
  });

  if (!dashboardApp) {
    console.error("Dashboard application not found");
    redirect("/auth/login?error=AppNotFound");
  }

  // Get user's menu items for dashboard application only
  let menuItems: MenuItemWithChildren[] = [];
  try {
    menuItems = await getUserMenuItems(session.user.id, dashboardApp.id);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    // If user not found, redirect to login
    redirect("/auth/login?error=UserNotFound&callbackUrl=/dashboard");
  }

  return (
    <DashboardShell menuItems={menuItems}>
      <DashboardContent />
    </DashboardShell>
  );
}
