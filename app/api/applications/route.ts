import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/applications
 * Get all applications list
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

    // Get all applications
    const applications = await db.application.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        path: true,
        icon: true,
        isActive: true,
        order: true,
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[GET_APPLICATIONS]", error);
    return NextResponse.json(
      { error: "Error occurred while fetching applications list" },
      { status: 500 }
    );
  }
}
