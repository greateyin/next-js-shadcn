/**
 * GET /api/notifications
 * Get user notifications
 * 
 * Query parameters:
 * - limit: number of notifications to return (default: 10)
 * - offset: pagination offset (default: 0)
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/notifications/notificationService'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getUserNotifications(session.user.id, limit, offset)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notifications: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[API_NOTIFICATIONS_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Mark all notifications as read
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await markAllNotificationsAsRead(session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error('[API_NOTIFICATIONS_PATCH]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

