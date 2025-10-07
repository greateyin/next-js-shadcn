import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles/[roleId]/menu-access
 * Get role's menu access permissions
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params

    const menuAccess = await db.menuItemRole.findMany({
      where: {
        roleId
      },
      select: {
        menuItemId: true,
        canView: true,
        canAccess: true
      }
    })

    return NextResponse.json({ menuAccess })
  } catch (error) {
    console.error("[ROLE_MENU_ACCESS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[roleId]/menu-access
 * Update role's menu access permissions (complete replacement)
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
    const { menuAccess } = body

    if (!Array.isArray(menuAccess)) {
      return NextResponse.json({ error: "Invalid menu access data" }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx: typeof db) => {
      // Delete all existing menu access permissions
      await tx.menuItemRole.deleteMany({
        where: {
          roleId
        }
      })

      // Create new menu access permissions
      if (menuAccess.length > 0) {
        await tx.menuItemRole.createMany({
          data: menuAccess.map((access: any) => ({
            roleId,
            menuItemId: access.menuItemId,
            canView: access.canView ?? true,
            canAccess: access.canAccess ?? true
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_MENU_ACCESS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
