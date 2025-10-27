import { Metadata } from "next"
import { db } from "@/lib/db"
import { PermissionsTable } from "@/components/admin/permissions/PermissionsTable"
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
} from "@/components/admin/common"

export const metadata: Metadata = {
  title: "Permission Management",
  description: "Manage RBAC permissions",
}

export default async function PermissionsPage() {
  const permissions = await db.permission.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  const formattedPermissions = permissions.map((permission) => ({
    id: permission.id,
    name: permission.name,
    description: permission.description || "No description",
    createdAt: permission.createdAt.toISOString(),
    roleCount: permission.roles.length,
    roles: permission.roles.map((rp) => rp.role?.name).filter(Boolean) as string[],
  }))

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Permission Management"
        description="Create, update, and delete permissions that control access across the platform"
      />

      <AdminCard
        title="Permissions"
        description="Manage the granular permissions that power RBAC"
        noPadding
      >
        <PermissionsTable permissions={formattedPermissions} />
      </AdminCard>
    </AdminPageContainer>
  )
}
