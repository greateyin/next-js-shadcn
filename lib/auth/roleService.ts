import { db } from "@/lib/db";
import { UserWithRoles } from "@/types/roles";

/**
 * Gets all roles and permissions for a user
 * @param userId - The user ID
 * @returns UserWithRoles object containing roles, permissions, and applications
 */
export async function getUserRolesAndPermissions(userId: string): Promise<UserWithRoles> {
  // Get user with roles, including related roles, permissions, and applications
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              },
              applications: {
                include: {
                  application: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Extract roles, permissions, and applications
  const roles = user.userRoles.map(userRole => userRole.role);
  
  const permissions = user.userRoles.flatMap(userRole => 
    userRole.role.permissions.map(rolePermission => rolePermission.permission)
  );
  
  const applications = user.userRoles.flatMap(userRole => 
    userRole.role.applications
      .filter(roleApp => roleApp.application.isActive)
      .map(roleApp => roleApp.application)
  );

  // Remove duplicates
  const uniquePermissions = Array.from(
    new Map(permissions.map(item => [item.id, item])).values()
  );
  
  const uniqueApplications = Array.from(
    new Map(applications.map(item => [item.id, item])).values()
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    roles,
    permissions: uniquePermissions,
    applications: uniqueApplications
  };
}

/**
 * Checks if a user has a specific permission
 * @param userId - The user ID
 * @param permissionName - The permission name to check
 * @returns boolean indicating if the user has the permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const userWithRoles = await getUserRolesAndPermissions(userId);
  return userWithRoles.permissions.some(p => p.name === permissionName);
}

/**
 * Checks if a user has access to a specific application
 * @param userId - The user ID
 * @param applicationPath - The application path to check
 * @returns boolean indicating if the user has access to the application
 */
export async function hasApplicationAccess(userId: string, applicationPath: string): Promise<boolean> {
  const userWithRoles = await getUserRolesAndPermissions(userId);
  return userWithRoles.applications.some(app => app.path === applicationPath && app.isActive);
}

/**
 * Creates a middleware function to check for specific permissions
 * @param permissionCheck - Permission name, array of names, or custom check function
 * @returns Middleware function that checks for the specified permission(s)
 */
export function requirePermission(permissionCheck: string | string[] | ((permissions: string[]) => boolean)) {
  return async (userId: string) => {
    const userWithRoles = await getUserRolesAndPermissions(userId);
    const userPermissions = userWithRoles.permissions.map(p => p.name);
    
    if (typeof permissionCheck === 'string') {
      return userPermissions.includes(permissionCheck);
    }
    
    if (Array.isArray(permissionCheck)) {
      return permissionCheck.some(perm => userPermissions.includes(perm));
    }
    
    if (typeof permissionCheck === 'function') {
      return permissionCheck(userPermissions);
    }
    
    return false;
  };
}

/**
 * Creates default roles and permissions in the database
 * Should be called during application setup or migration
 */
export async function createDefaultRolesAndPermissions() {
  // Create default roles if they don't exist
  const adminRole = await db.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access'
    }
  });

  const userRole = await db.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with limited access'
    }
  });

  // Create default permissions
  const permissions = [
    { name: 'users:read', description: 'View users' },
    { name: 'users:create', description: 'Create users' },
    { name: 'users:update', description: 'Update users' },
    { name: 'users:delete', description: 'Delete users' },
    { name: 'roles:read', description: 'View roles' },
    { name: 'roles:create', description: 'Create roles' },
    { name: 'roles:update', description: 'Update roles' },
    { name: 'roles:delete', description: 'Delete roles' },
    { name: 'applications:read', description: 'View applications' },
    { name: 'applications:create', description: 'Create applications' },
    { name: 'applications:update', description: 'Update applications' },
    { name: 'applications:delete', description: 'Delete applications' },
    { name: 'menu:read', description: 'View menu items' },
    { name: 'menu:create', description: 'Create menu items' },
    { name: 'menu:update', description: 'Update menu items' },
    { name: 'menu:delete', description: 'Delete menu items' },
  ];

  // Create all permissions
  for (const perm of permissions) {
    await db.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        name: perm.name,
        description: perm.description
      }
    });
  }

  // Assign all permissions to admin role
  const allPermissions = await db.permission.findMany();
  
  for (const perm of allPermissions) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id
      }
    });
  }

  // Assign limited permissions to user role
  const userPermissions = await db.permission.findMany({
    where: {
      name: {
        in: ['users:read']
      }
    }
  });

  for (const perm of userPermissions) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: perm.id
      }
    });
  }

  return {
    adminRole,
    userRole,
    permissions: allPermissions
  };
}