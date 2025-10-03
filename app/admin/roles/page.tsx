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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage system roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable roles={formattedRoles} />
        </CardContent>
      </Card>
    </div>
  );
}