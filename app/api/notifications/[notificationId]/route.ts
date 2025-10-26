/**
 * PATCH /api/notifications/[notificationId]
 * Mark notification as read
 * 
 * DELETE /api/notifications/[notificationId]
 * Delete a notification
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { 
  markNotificationAsRead, 
  deleteNotification 
} from '@/lib/notifications/notificationService'
import { db } from '@/lib/db'

interface RouteParams {
  params: {
    notificationId: string
  }
}

/**
 * PATCH - Mark notification as read
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify notification belongs to user
    const notification = await db.notification.findUnique({
      where: { id: params.notificationId },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const result = await markNotificationAsRead(params.notificationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: result.notification.id,
        type: result.notification.type,
        title: result.notification.title,
        message: result.notification.message,
        isRead: result.notification.isRead,
        readAt: result.notification.readAt?.toISOString() || null,
        createdAt: result.notification.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[API_NOTIFICATIONS_PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a notification
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify notification belongs to user
    const notification = await db.notification.findUnique({
      where: { id: params.notificationId },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const result = await deleteNotification(params.notificationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[API_NOTIFICATIONS_DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

