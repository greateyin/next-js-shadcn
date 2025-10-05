import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles/[roleId]/users
 * 獲取角色的用戶
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
 * 更新角色的用戶（完全替換）
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

    // 使用事務來確保數據一致性
    await db.$transaction(async (tx: typeof db) => {
      // 刪除現有的所有用戶關聯
      await tx.userRole.deleteMany({
        where: {
          roleId
        }
      })

      // 創建新的用戶關聯
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
