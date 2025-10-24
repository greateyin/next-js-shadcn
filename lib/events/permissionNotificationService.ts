import {
  permissionEventEmitter,
  PermissionEventType,
  PermissionEvent,
  onUserPermissionsChanged
} from './permissionEventEmitter';
import { permissionCache } from '@/lib/auth/permissionCache';
import { invalidateUserPermissionCacheMany } from '@/lib/auth/roleService';

/**
 * Permission notification service
 * Handles real-time notifications for permission changes
 */
class PermissionNotificationService {
  private static instance: PermissionNotificationService;
  private subscribers: Map<string, Set<(event: PermissionEvent) => void>> = new Map();
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PermissionNotificationService {
    if (!PermissionNotificationService.instance) {
      PermissionNotificationService.instance = new PermissionNotificationService();
    }
    return PermissionNotificationService.instance;
  }

  /**
   * Initialize the notification service
   * Sets up event listeners for cache invalidation
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Listen to all permission events
    permissionEventEmitter.onAnyPermissionEvent((event: PermissionEvent) => {
      this.handlePermissionEvent(event);
    });

    // Listen specifically to user permissions changed
    onUserPermissionsChanged((event: PermissionEvent) => {
      this.invalidateUserCache(event);
    });

    this.isInitialized = true;
    console.log('[PermissionNotificationService] Initialized');
  }

  /**
   * Handle permission event
   */
  private handlePermissionEvent(event: PermissionEvent): void {
    // Invalidate cache for affected users
    if (event.affectedUserIds && event.affectedUserIds.length > 0) {
      invalidateUserPermissionCacheMany(event.affectedUserIds).catch(error => {
        console.error('[PermissionNotificationService] Error invalidating cache:', error);
      });
    }

    // Notify subscribers
    this.notifySubscribers(event);
  }

  /**
   * Invalidate user cache
   */
  private invalidateUserCache(event: PermissionEvent): void {
    if (event.affectedUserIds && event.affectedUserIds.length > 0) {
      console.log(
        `[PermissionNotificationService] Invalidating cache for ${event.affectedUserIds.length} users`
      );
      invalidateUserPermissionCacheMany(event.affectedUserIds).catch(error => {
        console.error('[PermissionNotificationService] Error invalidating cache:', error);
      });
    }
  }

  /**
   * Subscribe to permission events for a user
   */
  subscribe(userId: string, callback: (event: PermissionEvent) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }

    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(userId)?.delete(callback);
    };
  }

  /**
   * Notify subscribers about permission event
   */
  private notifySubscribers(event: PermissionEvent): void {
    if (!event.affectedUserIds) {
      return;
    }

    for (const userId of event.affectedUserIds) {
      const callbacks = this.subscribers.get(userId);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('[PermissionNotificationService] Error in subscriber callback:', error);
          }
        });
      }
    }
  }

  /**
   * Get subscriber count for a user
   */
  getSubscriberCount(userId: string): number {
    return this.subscribers.get(userId)?.size ?? 0;
  }

  /**
   * Get total subscriber count
   */
  getTotalSubscriberCount(): number {
    let total = 0;
    for (const callbacks of this.subscribers.values()) {
      total += callbacks.size;
    }
    return total;
  }

  /**
   * Clear all subscribers
   */
  clearSubscribers(): void {
    this.subscribers.clear();
  }
}

export const permissionNotificationService = PermissionNotificationService.getInstance();

/**
 * Initialize permission notification service
 * Call this during application startup
 */
export function initializePermissionNotifications(): void {
  permissionNotificationService.initialize();
}

/**
 * Subscribe to permission changes for a user
 * 
 * @param userId - User ID
 * @param callback - Callback function
 * @returns Unsubscribe function
 */
export function subscribeToPermissionChanges(
  userId: string,
  callback: (event: PermissionEvent) => void
): () => void {
  return permissionNotificationService.subscribe(userId, callback);
}

/**
 * Get notification service for advanced usage
 */
export function getPermissionNotificationService() {
  return permissionNotificationService;
}

/**
 * Server-Sent Events (SSE) helper for real-time notifications
 * Use in API route: app/api/permissions/events/route.ts
 */
export function createSSEResponse(userId: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`)
      );

      // Subscribe to permission changes
      const unsubscribe = subscribeToPermissionChanges(userId, (event) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      });

      // Handle client disconnect
      const cleanup = () => {
        unsubscribe();
        controller.close();
      };

      // Set timeout to close connection after 24 hours
      const timeout = setTimeout(cleanup, 24 * 60 * 60 * 1000);

      return () => {
        clearTimeout(timeout);
        cleanup();
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

