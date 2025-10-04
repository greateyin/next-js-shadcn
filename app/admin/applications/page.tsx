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
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">Application Management</h2>
          <p className="text-gray-600 mt-2">Manage system applications and access control</p>
        </div>
      </div>

      <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Applications</CardTitle>
          <CardDescription className="text-gray-600">Configure applications and role access</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ApplicationsTable applications={formattedApplications} />
        </CardContent>
      </Card>
    </div>
  );
}