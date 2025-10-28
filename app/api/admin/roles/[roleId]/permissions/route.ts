import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"
import {
  emitMultipleUsersPermissionsChanged,
  emitRolePermissionAdded,
  emitRolePermissionRemoved
} from "@/lib/events/permissionEventEmitter"
import { notifyUsers } from "@/lib/notifications/notificationService"
import { NotificationType } from "@/types/notifications"

/**
 * GET /api/admin/roles/[roleId]/permissions
 * Get role's permissions
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params

    const rolePermissions = await db.rolePermission.findMany({
      where: {
        roleId
      },
      select: {
        permissionId: true
      }
    })

    const permissionIds = rolePermissions.map((rp: { permissionId: string }) => rp.permissionId)

    return NextResponse.json({ permissionIds })
  } catch (error) {
    console.error("[ROLE_PERMISSIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[roleId]/permissions
 * Update role's permissions (complete replacement)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params
    const body = await req.json()
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "Invalid permission IDs" }, { status: 400 })
    }

    const normalizedPermissionIds = Array.from(
      new Set(
        permissionIds
          .filter((permissionId: unknown): permissionId is string => typeof permissionId === "string")
          .map(permissionId => permissionId.trim())
          .filter(Boolean)
      )
    )

    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true }
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const existingRolePermissions = await db.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true }
    })

    const existingPermissionSet = new Set(
      existingRolePermissions.map(({ permissionId }) => permissionId)
    )
    const normalizedPermissionSet = new Set(normalizedPermissionIds)

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx: typeof db) => {
      // Delete all existing permission associations
      await tx.rolePermission.deleteMany({
        where: {
          roleId
        }
      })

      // Create new permission associations
      if (normalizedPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: normalizedPermissionIds.map(permissionId => ({
            roleId,
            permissionId
          }))
        })
      }
    })

    const addedPermissionIds = normalizedPermissionIds.filter(
      permissionId => !existingPermissionSet.has(permissionId)
    )
    const removedPermissionIds = Array.from(existingPermissionSet).filter(
      permissionId => !normalizedPermissionSet.has(permissionId)
    )

    if (addedPermissionIds.length > 0 || removedPermissionIds.length > 0) {
      const roleUsers = await db.userRole.findMany({
        where: { roleId },
        select: { userId: true }
      })

      const affectedUserIds = roleUsers.map(({ userId }) => userId)

      addedPermissionIds.forEach(permissionId => {
        emitRolePermissionAdded(role.id, permissionId, affectedUserIds)
      })

      removedPermissionIds.forEach(permissionId => {
        emitRolePermissionRemoved(role.id, permissionId, affectedUserIds)
      })

      if (affectedUserIds.length > 0) {
        await notifyUsers(affectedUserIds, {
          type: NotificationType.PERMISSION_CHANGED,
          title: "Role permissions updated",
          message: `Permissions for the "${role.name}" role were updated.`,
          data: {
            roleId: role.id,
            roleName: role.name,
            addedPermissions: addedPermissionIds,
            removedPermissions: removedPermissionIds
          }
        })

        emitMultipleUsersPermissionsChanged(
          affectedUserIds,
          `role:${role.name}:permissions-updated`
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_PERMISSIONS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
