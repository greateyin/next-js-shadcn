import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/menu-items
 * Get all menu items
 */
export async function GET() {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const menuItems = await db.menuItem.findMany({
      include: {
        application: {
          select: {
            name: true,
            displayName: true
          }
        }
      },
      orderBy: [
        { applicationId: "asc" },
        { order: "asc" }
      ]
    })

    // Format menu items with application name
    const formattedMenuItems = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      displayName: item.displayName,
      description: item.description,
      path: item.path,
      icon: item.icon,
      applicationName: item.application.displayName
    }))

    return NextResponse.json({ menuItems: formattedMenuItems })
  } catch (error) {
    console.error("[MENU_ITEMS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
