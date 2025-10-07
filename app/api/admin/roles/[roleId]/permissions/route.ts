import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

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

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx: typeof db) => {
      // Delete all existing permission associations
      await tx.rolePermission.deleteMany({
        where: {
          roleId
        }
      })

      // Create new permission associations
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId,
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
