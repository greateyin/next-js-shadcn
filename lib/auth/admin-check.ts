import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * 检查用户是否有管理员权限
 * @returns 如果有权限返回 session，否则返回 error response
 */
export async function checkAdminAuth() {
  const session = await auth();

  // 检查是否登录
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
      session: null,
    };
  }

  // 检查是否有管理员权限
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

  // 有权限，返回 session
  return {
    error: null,
    session,
  };
}

/**
 * 检查用户是否有特定应用的访问权限
 * @param session 用户 session
 * @param appPath 应用路径
 * @returns 是否有权限
 */
export function hasApplicationAccess(
  session: any,
  appPath: string
): boolean {
  // 管理员有所有权限
  const isAdmin =
    session.user.role === "admin" ||
    session.user.roleNames?.includes("admin") ||
    session.user.roleNames?.includes("super-admin");

  if (isAdmin) {
    return true;
  }

  // 检查是否有特定应用权限
  return session.user.applicationPaths?.includes(appPath) || false;
}
