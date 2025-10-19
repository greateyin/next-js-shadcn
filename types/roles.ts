// Default roles still available for backward compatibility
export type DefaultRole = "user" | "admin";

// For the enhanced role system
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  permission: Permission;
}

export interface Application {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  path: string;
  icon?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleApplication {
  id: string;
  roleId: string;
  applicationId: string;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  application: Application;
}

export type MenuItemType = "LINK" | "GROUP" | "DIVIDER" | "EXTERNAL";

export interface MenuItem {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  path: string;
  icon?: string | null;
  parentId?: string;
  applicationId: string;
  type: MenuItemType;
  order: number;
  isVisible: boolean;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  application: Application;
  parent?: MenuItem;
  children: MenuItem[];
}

// User with roles
export interface UserWithRoles {
  id: string;
  email: string;
  name?: string;
  roles: Role[];
  permissions: Permission[];
  applications: Application[];
}

// Helper types for middleware
export type PermissionCheck = string | string[] | ((permissions: string[]) => boolean);