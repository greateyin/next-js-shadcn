import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/permissions
 * Get all permissions
 */
export async function GET() {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const permissions = await db.permission.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("[PERMISSIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/permissions
 * Create a new permission
 */
export async function POST(req: Request) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const body = await req.json()
    const { name, description } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Permission name is required" }, { status: 400 })
    }

    const existing = await db.permission.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json({ error: "Permission already exists" }, { status: 400 })
    }

    const permission = await db.permission.create({
      data: {
        name,
        description: description || null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ permission }, { status: 201 })
  } catch (error) {
    console.error("[PERMISSIONS_POST]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
