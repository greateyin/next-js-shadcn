# Permission System

Complete documentation of the role-based access control (RBAC) and permission system implementation.

## 🎯 Overview

The permission system provides fine-grained access control using:

- **Roles**: Group users with similar permissions
- **Permissions**: Individual actions users can perform
- **Applications**: Multi-tenant application support
- **Menu Items**: Dynamic navigation based on permissions

## 🏗️ Architecture

### Permission Hierarchy

```
User → Role → Permission → Application
     ↓
Menu Item Access
```

### Database Schema

```prisma
// Core entities
model User {
  id        String    @id @default(cuid())
  userRoles UserRole[]
}

model Role {
  id          String            @id @default(cuid())
  name        String            @unique
  users       UserRole[]
  permissions RolePermission[]
  applications RoleApplication[]
}

model Permission {
  id          String         @id @default(cuid())
  name        String         @unique
  roles       RolePermission[]
}

model Application {
  id          String             @id @default(cuid())
  name        String             @unique
  roles       RoleApplication[]
  menuItems   MenuItem[]
}

model MenuItem {
  id            String          @id @default(cuid())
  roleAccess    MenuItemRole[]
}

// Junction tables
model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
}

model RoleApplication {
  roleId        String
  applicationId String
  role          Role        @relation(fields: [roleId], references: [id])
  application   Application @relation(fields: [applicationId], references: [id])
}

model MenuItemRole {
  menuItemId String
  roleId     String
  canView    Boolean @default(true)
  canAccess  Boolean @default(true)
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  role       Role     @relation(fields: [roleId], references: [id])
}
```

## 🔑 Default Roles and Permissions

### Built-in Roles

```typescript
// Default role definitions
export const DEFAULT_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  VIEWER: 'viewer'
} as const;
```

### Permission Categories

```typescript
// Permission categories
export const PERMISSION_CATEGORIES = {
  USER: 'user',
  ROLE: 'role', 
  APPLICATION: 'application',
  MENU: 'menu',
  AUDIT: 'audit',
  SYSTEM: 'system'
} as const;
```

### Default Permissions

```typescript
// Default permission definitions
export const DEFAULT_PERMISSIONS = {
  // User Management
  'user:read': 'Read user information',
  'user:create': 'Create new users',
  'user:update': 'Update user information',
  'user:delete': 'Delete users',
  'user:manage-roles': 'Manage user roles',
  
  // Role Management
  'role:read': 'Read role information',
  'role:create': 'Create new roles',
  'role:update': 'Update role information',
  'role:delete': 'Delete roles',
  'role:manage-permissions': 'Manage role permissions',
  
  // Application Management
  'application:read': 'Read application information',
  'application:create': 'Create new applications',
  'application:update': 'Update application information',
  'application:delete': 'Delete applications',
  
  // Menu Management
  'menu:read': 'Read menu items',
  'menu:create': 'Create menu items',
  'menu:update': 'Update menu items',
  'menu:delete': 'Delete menu items',
  
  // Audit Management
  'audit:read': 'Read audit logs',
  'audit:export': 'Export audit logs',
  
  // System Management
  'system:settings': 'Manage system settings',
  'system:backup': 'Perform system backups',
  'system:monitor': 'Monitor system health'
} as const;
```

## 🔧 Implementation

### Permission Checking

#### Server-Side Permission Check

```typescript
// lib/permissions.ts
export async function hasPermission(
  userId: string, 
  permissionName: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  return user?.userRoles.some(userRole =>
    userRole.role.permissions.some(rp =>
      rp.permission.name === permissionName
    )
  ) ?? false;
}
```

#### User Permission Helper

```typescript
// lib/auth/permissions.ts
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return [];

  const permissions = new Set<string>();
  
  user.userRoles.forEach(userRole => {
    userRole.role.permissions.forEach(rp => {
      permissions.add(rp.permission.name);
    });
  });

  return Array.from(permissions);
}
```

#### Application Access Check

```typescript
export async function hasApplicationAccess(
  userId: string,
  applicationName: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              applications: {
                include: { application: true }
              }
            }
          }
        }
      }
    }
  });

  return user?.userRoles.some(userRole =>
    userRole.role.applications.some(ra =>
      ra.application.name === applicationName
    )
  ) ?? false;
}
```

### Middleware Integration

#### Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Admin routes require admin role
    if (pathname.startsWith('/admin')) {
      if (!req.auth?.user.roleNames?.includes('admin')) {
        return NextResponse.redirect(new URL('/no-access', req.url));
      }
    }
    
    // API routes with specific permissions
    if (pathname.startsWith('/api/admin/users')) {
      const hasUserPermission = req.auth?.user.permissionNames?.includes('user:read');
      if (!hasUserPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
  },
  {
    callbacks: {
      authorized: ({ auth }) => !!auth
    }
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*'
  ]
};
```

### API Route Protection

#### Permission-Based API Routes

```typescript
// app/api/admin/users/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  
  // Check if user has permission to read users
  const hasPermission = session?.user.permissionNames?.includes('user:read');
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' }, 
      { status: 403 }
    );
  }
  
  // Fetch users
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      createdAt: true
    }
  });
  
  return NextResponse.json({ users });
}
```

### Server Actions Protection

#### Permission-Based Server Actions

```typescript
// actions/user/index.ts
'use server';

import { auth } from '@/auth';

export async function updateUser(userId: string, data: UserUpdateData) {
  const session = await auth();
  
  // Check if user has permission to update users
  const hasPermission = session?.user.permissionNames?.includes('user:update');
  
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
  
  // Update user
  const updatedUser = await db.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      status: true
    }
  });
  
  return updatedUser;
}
```

## 🎨 Frontend Integration

### Permission Hooks

```typescript
// hooks/usePermissions.ts
import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session } = useSession();
  
  const hasPermission = (permission: string): boolean => {
    return session?.user.permissionNames?.includes(permission) ?? false;
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => 
      session?.user.permissionNames?.includes(permission)
    ) ?? false;
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => 
      session?.user.permissionNames?.includes(permission)
    ) ?? false;
  };
  
  const hasRole = (role: string): boolean => {
    return session?.user.roleNames?.includes(role) ?? false;
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    permissions: session?.user.permissionNames ?? [],
    roles: session?.user.roleNames ?? []
  };
}
```

### Protected Components

```typescript
// components/PermissionGuard.tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions 
  } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true;
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### Usage Examples

```typescript
// Component usage
function UserManagement() {
  return (
    <PermissionGuard permission="user:read">
      <UsersTable />
    </PermissionGuard>
  );
}

function AdminPanel() {
  return (
    <PermissionGuard permissions={['user:read', 'user:write']} requireAll>
      <AdminDashboard />
    </PermissionGuard>
  );
}

function ConditionalButton() {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <button>View Users</button>
      {hasPermission('user:create') && (
        <button>Create User</button>
      )}
    </div>
  );
}
```

## 📊 Menu System Integration

### Dynamic Menu Generation

```typescript
// lib/menu/getUserMenu.ts
export async function getUserMenuItems(userId: string, applicationName: string) {
  return await db.menuItem.findMany({
    where: {
      application: {
        name: applicationName
      },
      isVisible: true,
      roleAccess: {
        some: {
          role: {
            users: {
              some: { userId }
            }
          },
          canView: true
        }
      }
    },
    orderBy: [
      { parentId: 'asc' },
      { order: 'asc' }
    ],
    include: {
      children: {
        orderBy: { order: 'asc' },
        where: {
          roleAccess: {
            some: {
              role: {
                users: {
                  some: { userId }
                }
              },
              canView: true
            }
          }
        }
      }
    }
  });
}
```

### Menu API

```typescript
// app/api/menu/route.ts
import { auth } from '@/auth';
import { getUserMenuItems } from '@/lib/menu/getUserMenu';

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const application = searchParams.get('application') || 'dashboard';
  
  try {
    const menuItems = await getUserMenuItems(session.user.id, application);
    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
```

## 🔧 Administration

### Role Management

```typescript
// actions/role/index.ts
'use server';

import { auth } from '@/auth';

export async function createRole(data: {
  name: string;
  description?: string;
  permissionIds: string[];
  applicationIds: string[];
}) {
  const session = await auth();
  
  // Check if user has permission to create roles
  const hasPermission = session?.user.permissionNames?.includes('role:create');
  
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
  
  // Create role with permissions and applications
  const role = await db.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        create: data.permissionIds.map(permissionId => ({
          permissionId
        }))
      },
      applications: {
        create: data.applicationIds.map(applicationId => ({
          applicationId
        }))
      }
    },
    include: {
      permissions: {
        include: { permission: true }
      },
      applications: {
        include: { application: true }
      }
    }
  });
  
  return role;
}
```

### User Role Assignment

```typescript
// actions/user/assignRole.ts
'use server';

export async function assignUserRole(userId: string, roleId: string) {
  const session = await auth();
  
  // Check if user has permission to manage user roles
  const hasPermission = session?.user.permissionNames?.includes('user:manage-roles');
  
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
  
  // Assign role to user
  await db.userRole.create({
    data: {
      userId,
      roleId
    }
  });
  
  // Invalidate user session to refresh permissions
  await invalidateUserSession(userId);
}
```

## 🧪 Testing

### Permission Testing

```typescript
// __tests__/permissions.test.ts
import { hasPermission } from '@/lib/permissions';

describe('Permission System', () => {
  it('should return true when user has permission', async () => {
    // Mock user with permission
    const result = await hasPermission('user-123', 'user:read');
    expect(result).toBe(true);
  });
  
  it('should return false when user lacks permission', async () => {
    // Mock user without permission
    const result = await hasPermission('user-123', 'user:delete');
    expect(result).toBe(false);
  });
});
```

### Component Testing

```typescript
// __tests__/PermissionGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '@/components/PermissionGuard';

// Mock usePermissions hook
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (perm: string) => perm === 'user:read',
    hasAnyPermission: (perms: string[]) => perms.includes('user:read'),
    hasAllPermissions: (perms: string[]) => perms.every(p => p === 'user:read'),
    hasRole: () => false
  })
}));

describe('PermissionGuard', () => {
  it('should render children when user has permission', () => {
    render(
      <PermissionGuard permission="user:read">
        <div>Protected Content</div>
      </PermissionGuard>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
```

## 🔄 Performance Optimization

### Permission Caching

```typescript
// lib/cache/permissions.ts
import { cache } from 'react';

export const getUserPermissionsCached = cache(async (userId: string) => {
  // Implementation with caching
  return await getUserPermissions(userId);
});

export const hasPermissionCached = cache(async (userId: string, permission: string) => {
  // Implementation with caching
  return await hasPermission(userId, permission);
});
```

### Session Optimization

```typescript
// auth.config.ts - JWT callback
export const authConfig: NextAuthConfig = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Load permissions once and store in token
        const permissions = await getUserPermissions(user.id);
        token.permissionNames = permissions;
      }
      return token;
    }
  }
};
```

---

**Next**: [Backend Development Guide](../development/backend.md) → API routes and server actions implementation