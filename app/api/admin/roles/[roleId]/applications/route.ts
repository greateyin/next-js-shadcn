import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles/[roleId]/applications
 * 獲取角色的應用程式
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roleId } = await params

    const roleApplications = await db.roleApplication.findMany({
      where: {
        roleId
      },
      select: {
        applicationId: true
      }
    })

    const applicationIds = roleApplications.map((ra: { applicationId: string }) => ra.applicationId)

    return NextResponse.json({ applicationIds })
  } catch (error) {
    console.error("[ROLE_APPLICATIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[roleId]/applications
 * 更新角色的應用程式（完全替換）
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roleId } = await params
    const body = await req.json()
    const { applicationIds } = body

    if (!Array.isArray(applicationIds)) {
      return NextResponse.json({ error: "Invalid application IDs" }, { status: 400 })
    }

    // 使用事務來確保數據一致性
    await db.$transaction(async (tx: typeof db) => {
      // 刪除現有的所有應用關聯
      await tx.roleApplication.deleteMany({
        where: {
          roleId
        }
      })

      // 創建新的應用關聯
      if (applicationIds.length > 0) {
        await tx.roleApplication.createMany({
          data: applicationIds.map((applicationId: string) => ({
            roleId,
            applicationId
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_APPLICATIONS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
