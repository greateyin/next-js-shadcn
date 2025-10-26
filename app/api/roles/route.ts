import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/roles
 * Get all roles list
 *
 * ⚠️ SECURITY: Admin-only endpoint
 * Requires user to have admin role
 */
export async function GET() {
  try {
    // Verify user identity
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⚠️ SECURITY: Check if user has admin role
    // This is a sensitive endpoint that should only be accessible to admins
    const isAdmin = session.user.roleNames?.includes("admin") ||
                    session.user.roleNames?.includes("super-admin");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get all roles
    const roles = await db.role.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("[GET_ROLES]", error);
    return NextResponse.json(
      { error: "Error occurred while fetching roles list" },
      { status: 500 }
    );
  }
}
