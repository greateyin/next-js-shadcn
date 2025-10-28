import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"
import {
  emitMultipleUsersPermissionsChanged,
  emitUserRoleAdded,
  emitUserRoleRemoved
} from "@/lib/events/permissionEventEmitter"
import { notifyUsers } from "@/lib/notifications/notificationService"
import { NotificationType } from "@/types/notifications"

/**
 * GET /api/admin/roles/[roleId]/users
 * Get role's users
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params

    const userRoles = await db.userRole.findMany({
      where: {
        roleId
      },
      select: {
        userId: true
      }
    })

    const userIds = userRoles.map((ur: { userId: string }) => ur.userId)

    return NextResponse.json({ userIds })
  } catch (error) {
    console.error("[ROLE_USERS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[roleId]/users
 * Update role's users (complete replacement)
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
    const { userIds } = body

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid user IDs" }, { status: 400 })
    }

    const normalizedUserIds = Array.from(
      new Set(
        userIds
          .filter((userId: unknown): userId is string => typeof userId === "string")
          .map(userId => userId.trim())
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

    const existingUserRoles = await db.userRole.findMany({
      where: { roleId },
      select: { userId: true }
    })

    const existingUserIdSet = new Set(existingUserRoles.map(({ userId }) => userId))
    const normalizedUserIdSet = new Set(normalizedUserIds)

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx: typeof db) => {
      // Delete all existing user associations
      await tx.userRole.deleteMany({
        where: {
          roleId
        }
      })

      // Create new user associations
      if (normalizedUserIds.length > 0) {
        await tx.userRole.createMany({
          data: normalizedUserIds.map(userId => ({
            roleId,
            userId
          }))
        })
      }
    })

    const addedUserIds = normalizedUserIds.filter(userId => !existingUserIdSet.has(userId))
    const removedUserIds = Array.from(existingUserIdSet).filter(
      userId => !normalizedUserIdSet.has(userId)
    )

    if (addedUserIds.length > 0) {
      addedUserIds.forEach(userId => {
        emitUserRoleAdded(userId, role.id)
      })

      await notifyUsers(addedUserIds, {
        type: NotificationType.ROLE_ASSIGNED,
        title: "Role assigned",
        message: `You have been granted the "${role.name}" role.`,
        data: {
          roleId: role.id,
          roleName: role.name,
          changeType: "assigned"
        }
      })
    }

    if (removedUserIds.length > 0) {
      removedUserIds.forEach(userId => {
        emitUserRoleRemoved(userId, role.id)
      })

      await notifyUsers(removedUserIds, {
        type: NotificationType.ROLE_REMOVED,
        title: "Role removed",
        message: `The "${role.name}" role is no longer assigned to your account.`,
        data: {
          roleId: role.id,
          roleName: role.name,
          changeType: "removed"
        }
      })
    }

    const affectedUserIds = [...new Set([...addedUserIds, ...removedUserIds])]

    if (affectedUserIds.length > 0) {
      emitMultipleUsersPermissionsChanged(
        affectedUserIds,
        `role:${role.name}:membership-updated`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_USERS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
