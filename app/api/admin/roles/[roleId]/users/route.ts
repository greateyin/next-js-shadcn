import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

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

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx: typeof db) => {
      // Delete all existing user associations
      await tx.userRole.deleteMany({
        where: {
          roleId
        }
      })

      // Create new user associations
      if (userIds.length > 0) {
        await tx.userRole.createMany({
          data: userIds.map((userId: string) => ({
            roleId,
            userId
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_USERS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
