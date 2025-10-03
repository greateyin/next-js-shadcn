import { Metadata } from "next";
import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage system users",
};

export default async function UsersPage() {
  // Get all users with their roles
  const users = await db.user.findMany({
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  // Format the data for the table
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name || "N/A",
    email: user.email,
    status: user.status,
    roles: user.userRoles.map((userRole) => userRole.role.name).join(", ") || "No roles",
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage system users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={formattedUsers} />
        </CardContent>
      </Card>
    </div>
  );
}