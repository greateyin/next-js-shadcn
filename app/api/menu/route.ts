import { NextResponse } from "next/server";
import { getMenuItems } from "@/actions/menu";

/**
 * GET /api/menu
 * Get all menu items
 */
export async function GET() {
  try {
    const result = await getMenuItems();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API_MENU_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
