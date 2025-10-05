import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/permissions
 * 獲取所有權限
 */
export async function GET() {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const permissions = await db.permission.findMany({
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("[PERMISSIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
