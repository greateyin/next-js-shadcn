import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * PATCH /api/admin/roles/[roleId]
 * Update role
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params
    const body = await req.json()
    const { name, description } = body

    // Check if new name conflicts with other roles
    if (name) {
      const existingRole = await db.role.findFirst({
        where: {
          name: name.toLowerCase().trim(),
          NOT: {
            id: roleId
          }
        }
      })

      if (existingRole) {
        return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
      }
    }

    const role = await db.role.update({
      where: {
        id: roleId
      },
      data: {
        name: name ? name.toLowerCase().trim() : undefined,
        description: description !== undefined ? description || null : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true,
            applications: true
          }
        }
      }
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error("[ROLE_PATCH]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/roles/[roleId]
 * Delete role
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params

    // Check if it's a system reserved role
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { name: true }
    })

    if (role && ['admin', 'user'].includes(role.name)) {
      return NextResponse.json({ error: "Cannot delete system role" }, { status: 400 })
    }

    await db.role.delete({
      where: {
        id: roleId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_DELETE]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
