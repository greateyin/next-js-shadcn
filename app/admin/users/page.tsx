import { Metadata } from "next";
import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/users/UsersTable";
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
} from "@/components/admin/common";

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
    <AdminPageContainer>
      <AdminPageHeader
        title="User Management"
        description="Manage system users and their roles"
      />

      <AdminCard
        title="Users"
        description="View and manage all registered users"
        noPadding
      >
        <UsersTable users={formattedUsers} />
      </AdminCard>
    </AdminPageContainer>
  );
}