import { Metadata } from "next";
import { db } from "@/lib/db";
import { ApplicationsTable } from "@/components/admin/applications/ApplicationsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Application Management",
  description: "Manage system applications",
};

export default async function ApplicationsPage() {
  // Get all applications with the roles that can access them
  const applications = await db.application.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      _count: {
        select: {
          menuItems: true,
        },
      },
    },
  });

  // Format the data for the table
  const formattedApplications = applications.map((app) => ({
    id: app.id,
    name: app.name,
    displayName: app.displayName,
    description: app.description || "No description",
    path: app.path,
    isActive: app.isActive,
    roles: app.roles.map((ra) => ra.role.name).join(", ") || "No roles",
    menuItemCount: app._count.menuItems,
    order: app.order,
    createdAt: app.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Application Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Manage system applications and access control</CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationsTable applications={formattedApplications} />
        </CardContent>
      </Card>
    </div>
  );
}