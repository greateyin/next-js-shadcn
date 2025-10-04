import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles/[roleId]/permissions
 * 獲取角色的權限
 */
export async function GET(
  req: Request,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rolePermissions = await db.rolePermission.findMany({
      where: {
        roleId: params.roleId
      },
      select: {
        permissionId: true
      }
    })

    const permissionIds = rolePermissions.map(rp => rp.permissionId)

    return NextResponse.json({ permissionIds })
  } catch (error) {
    console.error("[ROLE_PERMISSIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[roleId]/permissions
 * 更新角色的權限（完全替換）
 */
export async function PUT(
  req: Request,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "Invalid permission IDs" }, { status: 400 })
    }

    // 使用事務來確保數據一致性
    await db.$transaction(async (tx) => {
      // 刪除現有的所有權限關聯
      await tx.rolePermission.deleteMany({
        where: {
          roleId: params.roleId
        }
      })

      // 創建新的權限關聯
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: params.roleId,
            permissionId
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_PERMISSIONS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
