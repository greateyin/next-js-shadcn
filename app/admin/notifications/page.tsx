import { Metadata } from "next"
import { db } from "@/lib/db"
import { NotificationsTable } from "@/components/admin/notifications/NotificationsTable"
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
} from "@/components/admin/common"

export const metadata: Metadata = {
  title: "Notification Management",
  description: "Review and send system notifications",
}

export default async function NotificationsPage() {
  const [notifications, users] = await Promise.all([
    db.notification.findMany({
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
        createdAt: "desc",
      },
      take: 200,
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  const formattedNotifications = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    userId: notification.userId,
    userName: notification.user?.name || notification.user?.email || 'Unknown user',
    userEmail: notification.user?.email || 'N/A',
  }))

  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }))

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Notification Management"
        description="Track, create, and manage system notifications"
      />

      <AdminCard
        title="Notifications"
        description="Keep users informed with targeted or broadcast alerts"
        noPadding
      >
        <NotificationsTable notifications={formattedNotifications} users={formattedUsers} />
      </AdminCard>
    </AdminPageContainer>
  )
}
