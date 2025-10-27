import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * PATCH /api/admin/permissions/[permissionId]
 * Update a permission
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ permissionId: string }> }
) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const { permissionId } = await params
    const body = await req.json()
    const { name, description } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Permission name is required" }, { status: 400 })
    }

    const permission = await db.permission.update({
      where: { id: permissionId },
      data: {
        name,
        description: description || null,
      },
    })

    return NextResponse.json({ permission })
  } catch (error) {
    console.error("[PERMISSION_PATCH]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/permissions/[permissionId]
 * Delete a permission
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ permissionId: string }> }
) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const { permissionId } = await params

    await db.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { permissionId },
      })

      await tx.permission.delete({
        where: { id: permissionId },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PERMISSION_DELETE]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
