import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles
 * Get all roles
 */
export async function GET() {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const roles = await db.role.findMany({
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("[ROLES_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/roles
 * Create new role
 */
export async function POST(req: Request) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const body = await req.json()
    const { name, description } = body

    // Check if role name already exists
    const existingRole = await db.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
    }

    // Create role
    const role = await db.role.create({
      data: {
        name: name.toLowerCase().trim(),
        description: description || null
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

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error("[ROLES_POST]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
