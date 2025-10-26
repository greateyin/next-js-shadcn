/**
 * Notification types and interfaces
 */

export enum NotificationType {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  APPLICATION_DELETED = 'APPLICATION_DELETED',
  MENU_CREATED = 'MENU_CREATED',
  MENU_UPDATED = 'MENU_UPDATED',
  MENU_DELETED = 'MENU_DELETED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SECURITY_ALERT = 'SECURITY_ALERT',
  INFO = 'INFO',
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

export interface NotificationResponse {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: string | null
  createdAt: string
}

export interface NotificationsListResponse {
  notifications: NotificationResponse[]
  total: number
  unreadCount: number
}

/**
 * Notification templates for common events
 */
export const notificationTemplates = {
  userCreated: (userName: string) => ({
    type: NotificationType.USER_CREATED,
    title: 'New User Created',
    message: `User "${userName}" has been created successfully.`,
  }),

  userUpdated: (userName: string) => ({
    type: NotificationType.USER_UPDATED,
    title: 'User Updated',
    message: `User "${userName}" has been updated.`,
  }),

  userDeleted: (userName: string) => ({
    type: NotificationType.USER_DELETED,
    title: 'User Deleted',
    message: `User "${userName}" has been deleted.`,
  }),

  roleAssigned: (userName: string, roleName: string) => ({
    type: NotificationType.ROLE_ASSIGNED,
    title: 'Role Assigned',
    message: `Role "${roleName}" has been assigned to user "${userName}".`,
  }),

  roleRemoved: (userName: string, roleName: string) => ({
    type: NotificationType.ROLE_REMOVED,
    title: 'Role Removed',
    message: `Role "${roleName}" has been removed from user "${userName}".`,
  }),

  permissionChanged: (roleName: string) => ({
    type: NotificationType.PERMISSION_CHANGED,
    title: 'Permissions Changed',
    message: `Permissions for role "${roleName}" have been updated.`,
  }),

  applicationCreated: (appName: string) => ({
    type: NotificationType.APPLICATION_CREATED,
    title: 'Application Created',
    message: `Application "${appName}" has been created.`,
  }),

  applicationUpdated: (appName: string) => ({
    type: NotificationType.APPLICATION_UPDATED,
    title: 'Application Updated',
    message: `Application "${appName}" has been updated.`,
  }),

  applicationDeleted: (appName: string) => ({
    type: NotificationType.APPLICATION_DELETED,
    title: 'Application Deleted',
    message: `Application "${appName}" has been deleted.`,
  }),

  menuCreated: (menuName: string) => ({
    type: NotificationType.MENU_CREATED,
    title: 'Menu Item Created',
    message: `Menu item "${menuName}" has been created.`,
  }),

  menuUpdated: (menuName: string) => ({
    type: NotificationType.MENU_UPDATED,
    title: 'Menu Item Updated',
    message: `Menu item "${menuName}" has been updated.`,
  }),

  menuDeleted: (menuName: string) => ({
    type: NotificationType.MENU_DELETED,
    title: 'Menu Item Deleted',
    message: `Menu item "${menuName}" has been deleted.`,
  }),

  systemAlert: (message: string) => ({
    type: NotificationType.SYSTEM_ALERT,
    title: 'System Alert',
    message,
  }),

  securityAlert: (message: string) => ({
    type: NotificationType.SECURITY_ALERT,
    title: 'Security Alert',
    message,
  }),

  info: (title: string, message: string) => ({
    type: NotificationType.INFO,
    title,
    message,
  }),
}

