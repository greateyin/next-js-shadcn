/**
 * @fileoverview Dashboard Profile Page
 * @module app/dashboard/profile/page
 * @description User profile page within the dashboard layout
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserMenuItems, type MenuItemWithChildren } from "@/lib/menu";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfileContent } from "@/components/dashboard/profile-content";

export const metadata = {
  title: "Profile | Dashboard",
  description: "View and manage your profile information",
};

/**
 * Dashboard Profile Page Component
 * @component
 * @description Displays user profile within the dashboard layout
 */
export default async function DashboardProfilePage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/profile");
  }

  // Fetch additional account information
  const accountInfo = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      createdAt: true,
      lastSuccessfulLogin: true,
      isTwoFactorEnabled: true,
      status: true,
    },
  });

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
      <ProfileContent session={session} accountInfo={accountInfo} />
    </DashboardShell>
  );
}
