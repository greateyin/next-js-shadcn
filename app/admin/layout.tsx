import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserRolesAndPermissions } from "@/lib/auth/roleService";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Admin Dashboard | Administration",
  description: "Manage users, roles, and applications",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Get user roles and applications with error handling
  let userRolesAndPermissions;
  try {
    userRolesAndPermissions = await getUserRolesAndPermissions(session.user.id);
  } catch (error) {
    console.error("Error fetching user roles:", error);
    // User not found in database, clear session and redirect to login
    redirect("/auth/login?error=UserNotFound");
  }

  // Check if user has admin role
  const hasAdminAccess = userRolesAndPermissions.roles.some(
    (role) => role.name === "admin" || role.name === "super-admin"
  );

  // If not admin, redirect to no-access page
  if (!hasAdminAccess) {
    redirect("/no-access");
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AdminLayoutClient 
        user={session.user}
        applications={userRolesAndPermissions.applications}
      >
        {children}
      </AdminLayoutClient>
    </ThemeProvider>
  );
}