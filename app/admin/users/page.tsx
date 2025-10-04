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
    image: user.image,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    emailVerified: user.emailVerified?.toISOString() || null,
    loginAttempts: user.loginAttempts,
  }));

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-2">Manage system users and their roles</p>
        </div>
      </div>

      <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Users</CardTitle>
          <CardDescription className="text-gray-600">View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable users={formattedUsers} />
        </CardContent>
      </Card>
    </div>
  );
}