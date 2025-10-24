import { Session } from "next-auth";
import { getUserRolesAndPermissions } from "./roleService";

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  missing: string[];
  userPermissions?: string[];
}

/**
 * Check if user has required permissions before rendering
 * Useful for Server Components to prevent rendering unauthorized content
 * 
 * @param session - Next-auth session
 * @param requiredPermissions - Array of required permission names
 * @returns PermissionCheckResult with allowed status and missing permissions
 */
export async function checkPermissionsBeforeRender(
  session: Session | null,
  requiredPermissions: string[]
): Promise<PermissionCheckResult> {
  if (!session?.user?.id) {
    return {
      allowed: false,
      missing: requiredPermissions
    };
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    const userPermNames = userWithRoles.permissions.map(p => p.name);

    const missing = requiredPermissions.filter(
      p => !userPermNames.includes(p)
    );

    return {
      allowed: missing.length === 0,
      missing,
      userPermissions: userPermNames
    };
  } catch (error) {
    console.error('[PermissionCheck] Error checking permissions:', error);
    return {
      allowed: false,
      missing: requiredPermissions
    };
  }
}

/**
 * Check if user has any of the required permissions
 * 
 * @param session - Next-auth session
 * @param requiredPermissions - Array of permission names (user needs at least one)
 * @returns PermissionCheckResult
 */
export async function checkAnyPermission(
  session: Session | null,
  requiredPermissions: string[]
): Promise<PermissionCheckResult> {
  if (!session?.user?.id) {
    return {
      allowed: false,
      missing: requiredPermissions
    };
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    const userPermNames = userWithRoles.permissions.map(p => p.name);

    const hasAny = requiredPermissions.some(p => userPermNames.includes(p));
    const missing = requiredPermissions.filter(p => !userPermNames.includes(p));

    return {
      allowed: hasAny,
      missing,
      userPermissions: userPermNames
    };
  } catch (error) {
    console.error('[PermissionCheck] Error checking permissions:', error);
    return {
      allowed: false,
      missing: requiredPermissions
    };
  }
}

/**
 * Check if user has all required permissions
 * 
 * @param session - Next-auth session
 * @param requiredPermissions - Array of permission names (user needs all)
 * @returns PermissionCheckResult
 */
export async function checkAllPermissions(
  session: Session | null,
  requiredPermissions: string[]
): Promise<PermissionCheckResult> {
  return checkPermissionsBeforeRender(session, requiredPermissions);
}

/**
 * Check if user has access to a specific application
 * 
 * @param session - Next-auth session
 * @param applicationPath - Application path
 * @returns boolean
 */
export async function checkApplicationAccess(
  session: Session | null,
  applicationPath: string
): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    return userWithRoles.applications.some(
      app => app.path === applicationPath && app.isActive
    );
  } catch (error) {
    console.error('[PermissionCheck] Error checking application access:', error);
    return false;
  }
}

/**
 * Check if user has a specific role
 * 
 * @param session - Next-auth session
 * @param roleName - Role name
 * @returns boolean
 */
export async function checkUserRole(
  session: Session | null,
  roleName: string
): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    return userWithRoles.roles.some(r => r.name === roleName);
  } catch (error) {
    console.error('[PermissionCheck] Error checking user role:', error);
    return false;
  }
}

/**
 * Check if user has any of the required roles
 * 
 * @param session - Next-auth session
 * @param roleNames - Array of role names
 * @returns boolean
 */
export async function checkAnyRole(
  session: Session | null,
  roleNames: string[]
): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    return userWithRoles.roles.some(r => roleNames.includes(r.name));
  } catch (error) {
    console.error('[PermissionCheck] Error checking user roles:', error);
    return false;
  }
}

/**
 * Get user's permission names
 * 
 * @param session - Next-auth session
 * @returns Array of permission names
 */
export async function getUserPermissionNames(
  session: Session | null
): Promise<string[]> {
  if (!session?.user?.id) {
    return [];
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    return userWithRoles.permissions.map(p => p.name);
  } catch (error) {
    console.error('[PermissionCheck] Error getting user permissions:', error);
    return [];
  }
}

/**
 * Get user's role names
 * 
 * @param session - Next-auth session
 * @returns Array of role names
 */
export async function getUserRoleNames(
  session: Session | null
): Promise<string[]> {
  if (!session?.user?.id) {
    return [];
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    return userWithRoles.roles.map(r => r.name);
  } catch (error) {
    console.error('[PermissionCheck] Error getting user roles:', error);
    return [];
  }
}

/**
 * Get user's accessible application paths
 * 
 * @param session - Next-auth session
 * @returns Array of application paths
 */
export async function getUserApplicationPaths(
  session: Session | null
): Promise<string[]> {
  if (!session?.user?.id) {
    return [];
  }

  try {
    const userWithRoles = await getUserRolesAndPermissions(session.user.id);
    return userWithRoles.applications
      .filter(app => app.isActive)
      .map(app => app.path);
  } catch (error) {
    console.error('[PermissionCheck] Error getting user applications:', error);
    return [];
  }
}

