/**
 * Lightweight Auth utility - for sub-applications to read cross-domain Session
 * 
 * Use cases:
 * - When application is deployed on subdomain (e.g. admin.example.com, dashboard.example.com)
 * - Need to read session cookie created by auth.example.com
 * 
 * @module lib/auth/subdomain-auth
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Get session token name from Cookie
 */
function getSessionTokenName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/**
 * Lightweight auth function - read session from database
 * 
 * @returns Session object or null
 * 
 * @example
 * ```ts
 * // Use in Server Component
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
    // Read session from database (including user information)
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
    
    // Check if session has expired
    if (!session || session.expires < new Date()) {
      return null;
    }
    
    // Extract roles, permissions, applications
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
    
    // Return formatted session
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
 * Check if user has administrator permissions
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
 * Check if user can access specified application
 */
export async function canAccessApp(appPath: string): Promise<boolean> {
  const session = await getSubdomainSession();
  
  if (!session) {
    return false;
  }
  
  // Admin can access all applications
  if (session.user.roles.includes("admin") || 
      session.user.roles.includes("super-admin")) {
    return true;
  }
  
  // Check if in user's application list
  return session.user.applicationPaths.includes(appPath);
}

/**
 * Check if user has specified permission
 */
export async function hasPermission(permissionName: string): Promise<boolean> {
  const session = await getSubdomainSession();
  
  if (!session) {
    return false;
  }
  
  return session.user.permissions.includes(permissionName);
}

/**
 * Get current user information (for API routes)
 */
export async function getCurrentUser() {
  const session = await getSubdomainSession();
  return session?.user || null;
}
