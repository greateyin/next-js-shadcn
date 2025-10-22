'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RecentActivityUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface RecentActivityLog {
  id: string
  action: string
  status?: string | null
  timestamp: string
  user?: RecentActivityUser | null
}

interface RecentActivityProps {
  auditLogs?: RecentActivityLog[] | null
}

function formatDate(dateString?: string | null): string {
  if (!dateString) {
    return "Unknown time"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "Unknown time"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date)
}

function getUserDisplayName(user?: RecentActivityUser | null): string {
  if (!user) {
    return "System"
  }

  return user.name || user.email || "Unknown user"
}

export function RecentActivity({ auditLogs }: RecentActivityProps) {
  const activities = auditLogs?.filter((log): log is RecentActivityLog => Boolean(log)) ?? []

  if (activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No recent activity found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => {
        const displayName = getUserDisplayName(activity.user)
        const avatarInitial = displayName.charAt(0).toUpperCase()

        return (
          <div key={activity.id} className="flex items-start gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={activity.user?.image ?? undefined}
                alt={displayName}
              />
              <AvatarFallback>{avatarInitial}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                {activity.action}
                {activity.status ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {activity.status.toLowerCase()}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(activity.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
