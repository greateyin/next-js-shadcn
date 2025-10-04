import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles
 * 獲取所有角色
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
 * 創建新角色
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description } = body

    // 檢查角色名稱是否已存在
    const existingRole = await db.role.findUnique({
      where: { name }
    })

    if (existingRole) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 })
    }

    // 創建角色
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
