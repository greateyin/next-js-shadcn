import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"
import { NotificationType } from "@/types/notifications"
import type { Prisma } from "@prisma/client"

function isValidNotificationType(value: string): value is NotificationType {
  return Object.values(NotificationType).includes(value as NotificationType)
}

/**
 * GET /api/admin/notifications
 * Retrieve notifications with optional filters
 */
export async function GET(req: Request) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const page = Number(searchParams.get('page') || 1)
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const where: Prisma.NotificationWhereInput = {}

    if (status === 'read') where.isRead = true
    if (status === 'unread') where.isRead = false
    if (userId) where.userId = userId
    if (type && isValidNotificationType(type)) {
      where.type = type
    }

    const [total, notifications] = await Promise.all([
      db.notification.count({ where }),
      db.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({ notifications, total })
  } catch (error) {
    console.error('[ADMIN_NOTIFICATIONS_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/notifications
 * Create notifications for one or many users
 */
export async function POST(req: Request) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const body = await req.json()
    const { title, message, type, userId, broadcast, metadata } = body

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Title, message, and type are required' }, { status: 400 })
    }

    if (!isValidNotificationType(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    let targetUserIds: string[] = []

    if (broadcast) {
      const users = await db.user.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      targetUserIds = users.map((user) => user.id)
    } else if (userId) {
      targetUserIds = [userId]
    } else {
      return NextResponse.json({ error: 'A target user is required unless broadcasting' }, { status: 400 })
    }

    if (!targetUserIds.length) {
      return NextResponse.json({ error: 'No recipients found for the notification' }, { status: 400 })
    }

    const notifications = await db.$transaction(async (tx) => {
      const created = await Promise.all(
        targetUserIds.map((targetId) =>
          tx.notification.create({
            data: {
              userId: targetId,
              title,
              message,
              type,
              data: metadata || null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        )
      )

      return created
    })

    return NextResponse.json({ notifications }, { status: 201 })
  } catch (error) {
    console.error('[ADMIN_NOTIFICATIONS_POST]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
