import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/applications
 * 獲取所有應用程式
 */
export async function GET() {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const applications = await db.application.findMany({
      orderBy: {
        order: "asc"
      }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("[APPLICATIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
