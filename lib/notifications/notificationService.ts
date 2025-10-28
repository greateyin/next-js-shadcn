/**
 * Notification Service
 * Handles creation, retrieval, and management of notifications
 */

import { db } from '@/lib/db'
import { CreateNotificationInput } from '@/types/notifications'

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || null,
      },
    })

    return {
      success: true,
      notification,
    }
  } catch (error) {
    console.error('[createNotification] Error:', error)
    return {
      success: false,
      error: 'Failed to create notification',
    }
  }
}

/**
 * Create the same notification for multiple users
 */
export async function notifyUsers(
  userIds: string[],
  notification: Omit<CreateNotificationInput, "userId">
) {
  const results = await Promise.all(
    userIds.map(async userId => ({
      userId,
      ...(await createNotification({ ...notification, userId }))
    }))
  )

  const failures = results.filter(result => !result.success)
  if (failures.length > 0) {
    console.warn(
      `[notifyUsers] Failed to deliver notification to users: ${failures
        .map(result => result.userId)
        .join(", ")}`
    )
  }

  return {
    success: failures.length === 0,
    results
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 10,
  offset: number = 0
) {
  try {
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where: { userId } }),
    ])

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    })

    return {
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unreadCount,
    }
  } catch (error) {
    // Check if error is due to missing table
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTableMissing = errorMessage.includes('does not exist') ||
                          errorMessage.includes('P2021');

    if (isTableMissing) {
      console.warn('[getUserNotifications] Notification table does not exist. Run: npx prisma migrate dev');
      // Return empty notifications gracefully instead of error
      return {
        success: true,
        notifications: [],
        total: 0,
        unreadCount: 0,
      }
    }

    console.error('[getUserNotifications] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch notifications',
      notifications: [],
      total: 0,
      unreadCount: 0,
    }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return {
      success: true,
      notification,
    }
  } catch (error) {
    console.error('[markNotificationAsRead] Error:', error)
    return {
      success: false,
      error: 'Failed to mark notification as read',
    }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return {
      success: true,
      count: result.count,
    }
  } catch (error) {
    console.error('[markAllNotificationsAsRead] Error:', error)
    return {
      success: false,
      error: 'Failed to mark notifications as read',
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    await db.notification.delete({
      where: { id: notificationId },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('[deleteNotification] Error:', error)
    return {
      success: false,
      error: 'Failed to delete notification',
    }
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
  try {
    const result = await db.notification.deleteMany({
      where: { userId },
    })

    return {
      success: true,
      count: result.count,
    }
  } catch (error) {
    console.error('[deleteAllNotifications] Error:', error)
    return {
      success: false,
      error: 'Failed to delete notifications',
    }
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await db.notification.count({
      where: { userId, isRead: false },
    })

    return {
      success: true,
      count,
    }
  } catch (error) {
    // Check if error is due to missing table
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTableMissing = errorMessage.includes('does not exist') ||
                          errorMessage.includes('P2021');

    if (isTableMissing) {
      // Return 0 gracefully if table doesn't exist
      return {
        success: true,
        count: 0,
      }
    }

    console.error('[getUnreadNotificationCount] Error:', error)
    return {
      success: false,
      error: 'Failed to get unread count',
      count: 0,
    }
  }
}

/**
 * Broadcast notification to multiple users
 */
export async function broadcastNotification(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>
) {
  try {
    const notifications = await db.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || null,
      })),
    })

    return {
      success: true,
      count: notifications.count,
    }
  } catch (error) {
    console.error('[broadcastNotification] Error:', error)
    return {
      success: false,
      error: 'Failed to broadcast notification',
    }
  }
}

