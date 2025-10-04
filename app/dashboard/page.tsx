/**
 * @fileoverview Dashboard Page
 * @module app/dashboard/page
 * @description Main dashboard page with dynamic menu based on user roles
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

  // Get user's menu items based on their roles with error handling
  let menuItems: MenuItemWithChildren[] = [];
  try {
    menuItems = await getUserMenuItems(session.user.id);
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
