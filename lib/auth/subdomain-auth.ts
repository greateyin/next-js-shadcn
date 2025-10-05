/**
 * 轻量级 Auth 工具 - 用于子应用读取跨域 Session
 * 
 * 使用场景：
 * - 当应用部署在子域名（如 admin.example.com, dashboard.example.com）
 * - 需要读取由 auth.example.com 创建的 session cookie
 * 
 * @module lib/auth/subdomain-auth
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * 从 Cookie 中获取 session token 名称
 */
function getSessionTokenName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/**
 * 轻量级 auth 函数 - 从数据库读取 session
 * 
 * @returns Session 对象或 null
 * 
 * @example
 * ```ts
 * // 在 Server Component 中使用
 * import { getSubdomainSession } from "@/lib/auth/subdomain-auth";
 * 
 * export default async function AdminPage() {
 *   const session = await getSubdomainSession();
 *   
 *   if (!session) {
 *     redirect("/auth/login");
 *   }
 *   
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 */
export async function getSubdomainSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionTokenName());
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    // 从数据库读取 session（包含用户信息）
    const session = await db.session.findUnique({
      where: { sessionToken: sessionToken.value },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true }
                    },
                    applications: {
                      include: { application: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // 检查 session 是否过期
    if (!session || session.expires < new Date()) {
      return null;
    }
    
    // 提取角色、权限、应用
    const roles = session.user.userRoles.map(ur => ur.role.name);
    const permissions = [
      ...new Set(
        session.user.userRoles.flatMap(ur =>
          ur.role.permissions.map(rp => rp.permission.name)
        )
      )
    ];
    const applicationPaths = [
      ...new Set(
        session.user.userRoles.flatMap(ur =>
          ur.role.applications.map(ra => ra.application.path)
        )
      )
    ];
    
    // 返回格式化的 session
    return {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
        role: roles[0] || "user",
        roles,
        permissions,
        applicationPaths,
        status: session.user.status,
      },
      expires: session.expires,
    };
  } catch (error) {
    console.error("[SUBDOMAIN_AUTH] Error reading session:", error);
    return null;
  }
}

/**
 * 检查用户是否有管理员权限
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSubdomainSession();
  
  if (!session) {
    return false;
  }
  
  return session.user.roles.includes("admin") || 
         session.user.roles.includes("super-admin");
}

/**
 * 检查用户是否可以访问指定应用
 */
export async function canAccessApp(appPath: string): Promise<boolean> {
  const session = await getSubdomainSession();
  
  if (!session) {
    return false;
  }
  
  // 管理员可以访问所有应用
  if (session.user.roles.includes("admin") || 
      session.user.roles.includes("super-admin")) {
    return true;
  }
  
  // 检查是否在用户的应用列表中
  return session.user.applicationPaths.includes(appPath);
}

/**
 * 检查用户是否有指定权限
 */
export async function hasPermission(permissionName: string): Promise<boolean> {
  const session = await getSubdomainSession();
  
  if (!session) {
    return false;
  }
  
  return session.user.permissions.includes(permissionName);
}

/**
 * 获取当前用户信息（用于 API 路由）
 */
export async function getCurrentUser() {
  const session = await getSubdomainSession();
  return session?.user || null;
}
