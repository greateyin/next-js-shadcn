import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"
import { NotificationType } from "@/types/notifications"
import type { Prisma } from "@prisma/client"

function isValidNotificationType(value: string | undefined): value is NotificationType {
  return value ? Object.values(NotificationType).includes(value as NotificationType) : false
}

/**
 * PATCH /api/admin/notifications/[notificationId]
 * Update notification status or content
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const { notificationId } = await params
    const body = await req.json()
    const { title, message, type, isRead, metadata } = body

    const data: Prisma.NotificationUpdateInput = {}

    if (title !== undefined) data.title = title
    if (message !== undefined) data.message = message
    if (isValidNotificationType(type)) data.type = type
    if (metadata !== undefined) data.data = metadata

    if (isRead !== undefined) {
      data.isRead = !!isRead
      data.readAt = isRead ? new Date() : null
    }

    const notification = await db.notification.update({
      where: { id: notificationId },
      data,
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

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('[ADMIN_NOTIFICATION_PATCH]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/notifications/[notificationId]
 * Delete a notification
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const { notificationId } = await params

    await db.notification.delete({
      where: { id: notificationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_NOTIFICATION_DELETE]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
