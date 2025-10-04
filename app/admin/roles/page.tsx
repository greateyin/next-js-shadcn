import { Metadata } from "next";
import { db } from "@/lib/db";
import { RolesTable } from "@/components/admin/roles/RolesTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Role Management",
  description: "Manage system roles and permissions",
};

export default async function RolesPage() {
  // Get all roles with their permissions
  const roles = await db.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
          applications: true,
        },
      },
    },
  });

  // Format the data for the table
  const formattedRoles = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description || "No description",
    permissions: role.permissions.map((rp) => rp.permission.name).join(", ") || "No permissions",
    userCount: role._count.users,
    applicationCount: role._count.applications,
    createdAt: role.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">Role Management</h2>
          <p className="text-gray-600 mt-2">Manage system roles and their permissions</p>
        </div>
      </div>

      <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Roles</CardTitle>
          <CardDescription className="text-gray-600">Configure roles and assign permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <RolesTable roles={formattedRoles} />
        </CardContent>
      </Card>
    </div>
  );
}