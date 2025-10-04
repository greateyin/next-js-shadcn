import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * GET /api/admin/applications
 * 獲取所有應用程式
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
