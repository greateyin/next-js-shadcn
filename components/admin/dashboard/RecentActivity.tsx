'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Activity {
  id: string
  user: {
    name: string
    image?: string
  }
  action: string
  timestamp: string
}

const recentActivities: Activity[] = [
  {
    id: "1",
    user: {
      name: "Admin User",
      image: "",
    },
    action: "Created a new role: Editor",
    timestamp: "2023-11-09T12:45:00Z"
  },
  {
    id: "2",
    user: {
      name: "John Doe",
      image: "",
    },
    action: "Updated user permissions",
    timestamp: "2023-11-09T11:30:00Z"
  },
  {
    id: "3",
    user: {
      name: "Jane Smith",
      image: "",
    },
    action: "Disabled application: Reports",
    timestamp: "2023-11-09T10:15:00Z"
  },
  {
    id: "4",
    user: {
      name: "Admin User",
      image: "",
    },
    action: "Added new user: marketing@example.com",
    timestamp: "2023-11-09T09:00:00Z"
  },
  {
    id: "5",
    user: {
      name: "John Doe",
      image: "",
    },
    action: "Updated menu structure",
    timestamp: "2023-11-08T16:45:00Z"
  }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {recentActivities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.user.image} alt={activity.user.name} />
            <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{activity.user.name}</p>
            <p className="text-sm text-muted-foreground">
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}