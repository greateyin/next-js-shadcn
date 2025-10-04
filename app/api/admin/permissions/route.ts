import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * GET /api/admin/permissions
 * 獲取所有權限
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
