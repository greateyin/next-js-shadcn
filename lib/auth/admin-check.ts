import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Check if user has administrator permissions
 * @returns Returns session if authorized, otherwise returns error response
 */
export async function checkAdminAuth() {
  const session = await auth();

  // Check if logged in
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
      session: null,
    };
  }

  // Check if has administrator permissions
  const isAdmin =
    session.user.role === "admin" ||
    session.user.roleNames?.includes("admin") ||
    session.user.roleNames?.includes("super-admin");

  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
      session: null,
    };
  }

  // Has permission, return session
  return {
    error: null,
    session,
  };
}

/**
 * Check if user has access permission to specific application
 * @param session User session
 * @param appPath Application path
 * @returns Whether has permission
 */
export function hasApplicationAccess(
  session: any,
  appPath: string
): boolean {
  // Admin has all permissions
  const isAdmin =
    session.user.role === "admin" ||
    session.user.roleNames?.includes("admin") ||
    session.user.roleNames?.includes("super-admin");

  if (isAdmin) {
    return true;
  }

  // Check if has specific application permission
  return session.user.applicationPaths?.includes(appPath) || false;
}
