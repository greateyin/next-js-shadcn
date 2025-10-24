import { EventEmitter } from 'events';

/**
 * Permission change event types
 */
export enum PermissionEventType {
  USER_ROLE_ADDED = 'user:role:added',
  USER_ROLE_REMOVED = 'user:role:removed',
  ROLE_PERMISSION_ADDED = 'role:permission:added',
  ROLE_PERMISSION_REMOVED = 'role:permission:removed',
  ROLE_CREATED = 'role:created',
  ROLE_UPDATED = 'role:updated',
  ROLE_DELETED = 'role:deleted',
  PERMISSION_CREATED = 'permission:created',
  PERMISSION_UPDATED = 'permission:updated',
  PERMISSION_DELETED = 'permission:deleted',
  USER_PERMISSIONS_CHANGED = 'user:permissions:changed'
}

/**
 * Permission event data
 */
export interface PermissionEvent {
  type: PermissionEventType;
  userId?: string;
  roleId?: string;
  permissionId?: string;
  affectedUserIds?: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Permission event emitter
 * Emits events when permissions change
 */
class PermissionEventEmitter extends EventEmitter {
  private static instance: PermissionEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PermissionEventEmitter {
    if (!PermissionEventEmitter.instance) {
      PermissionEventEmitter.instance = new PermissionEventEmitter();
    }
    return PermissionEventEmitter.instance;
  }

  /**
   * Emit permission event
   */
  emitPermissionEvent(event: PermissionEvent): void {
    console.log(`[PermissionEvent] ${event.type} - ${JSON.stringify(event)}`);
    this.emit(event.type, event);
    this.emit('permission:changed', event);
  }

  /**
   * Subscribe to permission events
   */
  onPermissionEvent(
    type: PermissionEventType,
    callback: (event: PermissionEvent) => void
  ): void {
    this.on(type, callback);
  }

  /**
   * Subscribe to all permission events
   */
  onAnyPermissionEvent(callback: (event: PermissionEvent) => void): void {
    this.on('permission:changed', callback);
  }

  /**
   * Unsubscribe from permission events
   */
  offPermissionEvent(
    type: PermissionEventType,
    callback: (event: PermissionEvent) => void
  ): void {
    this.off(type, callback);
  }
}

export const permissionEventEmitter = PermissionEventEmitter.getInstance();

/**
 * Emit user role added event
 */
export function emitUserRoleAdded(userId: string, roleId: string): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.USER_ROLE_ADDED,
    userId,
    roleId,
    affectedUserIds: [userId],
    timestamp: new Date()
  });
}

/**
 * Emit user role removed event
 */
export function emitUserRoleRemoved(userId: string, roleId: string): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.USER_ROLE_REMOVED,
    userId,
    roleId,
    affectedUserIds: [userId],
    timestamp: new Date()
  });
}

/**
 * Emit role permission added event
 */
export function emitRolePermissionAdded(roleId: string, permissionId: string, affectedUserIds: string[]): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.ROLE_PERMISSION_ADDED,
    roleId,
    permissionId,
    affectedUserIds,
    timestamp: new Date()
  });
}

/**
 * Emit role permission removed event
 */
export function emitRolePermissionRemoved(roleId: string, permissionId: string, affectedUserIds: string[]): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.ROLE_PERMISSION_REMOVED,
    roleId,
    permissionId,
    affectedUserIds,
    timestamp: new Date()
  });
}

/**
 * Emit role created event
 */
export function emitRoleCreated(roleId: string): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.ROLE_CREATED,
    roleId,
    timestamp: new Date()
  });
}

/**
 * Emit role updated event
 */
export function emitRoleUpdated(roleId: string, affectedUserIds: string[]): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.ROLE_UPDATED,
    roleId,
    affectedUserIds,
    timestamp: new Date()
  });
}

/**
 * Emit role deleted event
 */
export function emitRoleDeleted(roleId: string, affectedUserIds: string[]): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.ROLE_DELETED,
    roleId,
    affectedUserIds,
    timestamp: new Date()
  });
}

/**
 * Emit user permissions changed event
 * This is the main event that triggers cache invalidation
 */
export function emitUserPermissionsChanged(userId: string, reason: string): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.USER_PERMISSIONS_CHANGED,
    userId,
    affectedUserIds: [userId],
    timestamp: new Date(),
    metadata: { reason }
  });
}

/**
 * Emit multiple users permissions changed event
 */
export function emitMultipleUsersPermissionsChanged(userIds: string[], reason: string): void {
  permissionEventEmitter.emitPermissionEvent({
    type: PermissionEventType.USER_PERMISSIONS_CHANGED,
    affectedUserIds: userIds,
    timestamp: new Date(),
    metadata: { reason, count: userIds.length }
  });
}

/**
 * Subscribe to user permissions changed events
 * Useful for cache invalidation
 */
export function onUserPermissionsChanged(
  callback: (event: PermissionEvent) => void
): void {
  permissionEventEmitter.onPermissionEvent(
    PermissionEventType.USER_PERMISSIONS_CHANGED,
    callback
  );
}

/**
 * Get event emitter for advanced usage
 */
export function getPermissionEventEmitter() {
  return permissionEventEmitter;
}

