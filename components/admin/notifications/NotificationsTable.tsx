'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddNotificationDialog } from "./AddNotificationDialog"
import { DeleteNotificationDialog } from "./DeleteNotificationDialog"
import { BellRing, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationType } from "@/types/notifications"

interface NotificationRow {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  readAt?: string | null
  userId: string
  userName: string
  userEmail: string
}

interface NotificationUserOption {
  id: string
  name: string | null
  email: string
}

interface NotificationApiResponse {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string | Date
  readAt?: string | Date | null
  userId: string
  user?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface NotificationsTableProps {
  notifications: NotificationRow[]
  users: NotificationUserOption[]
}

export function NotificationsTable({ notifications: initialNotifications, users }: NotificationsTableProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationRow | null>(null)

  useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  const notificationTypeOptions = useMemo(() => Object.values(NotificationType), [])

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (statusFilter === 'unread' && notification.isRead) return false
      if (statusFilter === 'read' && !notification.isRead) return false
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false
      if (userFilter !== 'all' && notification.userId !== userFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesTitle = notification.title.toLowerCase().includes(term)
        const matchesMessage = notification.message.toLowerCase().includes(term)
        const matchesUser = `${notification.userName ?? ''} ${notification.userEmail}`.toLowerCase().includes(term)
        if (!matchesTitle && !matchesMessage && !matchesUser) return false
      }
      return true
    })
  }, [notifications, statusFilter, typeFilter, userFilter, searchTerm])

  const mapNotification = (notification: NotificationApiResponse): NotificationRow => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt:
      typeof notification.createdAt === 'string'
        ? notification.createdAt
        : notification.createdAt.toISOString(),
    readAt: notification.readAt
      ? typeof notification.readAt === 'string'
        ? notification.readAt
        : notification.readAt.toISOString()
      : null,
    userId: notification.userId,
    userName: notification.user?.name || notification.user?.email || 'Unknown user',
    userEmail: notification.user?.email || 'N/A',
  })

  const handleAdd = async (data: {
    title: string
    message: string
    type: NotificationType
    userId?: string
    broadcast?: boolean
    metadata?: Record<string, unknown>
  }) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create notification')
      }

      const result = (await res.json()) as {
        notifications?: NotificationApiResponse[]
        notification?: NotificationApiResponse
      }
      const created = result.notifications ?? (result.notification ? [result.notification] : [])
      const mapped = created.map(mapNotification)
      setNotifications((prev) => [...mapped, ...prev])
      toast.success('Notification created successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create notification'
      toast.error(message)
    }
  }

  const handleToggleRead = async (notification: NotificationRow) => {
    try {
      const res = await fetch(`/api/admin/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !notification.isRead }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update notification')
      }

      const response = (await res.json()) as { notification: NotificationApiResponse }
      const mapped = mapNotification(response.notification)
      setNotifications((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)))
      toast.success(mapped.isRead ? 'Notification marked as read' : 'Notification marked as unread')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update notification'
      toast.error(message)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete notification')
      }

      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
      toast.success('Notification deleted successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification'
      toast.error(message)
    }
  }

  const columns: ColumnDef<NotificationRow>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const notification = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-gray-900">{notification.title}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 max-w-[360px]">{notification.message}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          {row.original.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Recipient',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-medium text-gray-900">{row.original.userName}</span>
          <p className="text-xs text-gray-500">{row.original.userEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return (
          <div className="space-y-0.5">
            <span className="text-gray-900">{date.toLocaleDateString()}</span>
            <p className="text-xs text-gray-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.isRead ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
        >
          {row.original.isRead ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const notification = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-200/50 shadow-xl bg-white/95 backdrop-blur-xl p-2">
              <DropdownMenuLabel className="px-3 py-2 font-semibold text-gray-900">Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2"
                onClick={() => handleToggleRead(notification)}
              >
                {notification.isRead ? 'Mark as unread' : 'Mark as read'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50 px-3 py-2 text-red-600"
                onClick={() => {
                  setSelectedNotification(notification)
                  setDeleteDialogOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredNotifications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'unread' | 'read')}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="border-gray-300 focus:border-blue-500 lg:max-w-xs"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-gray-300 lg:w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All types</SelectItem>
                {notificationTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="border-gray-300 lg:w-48">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 max-h-72 overflow-y-auto">
                <SelectItem value="all">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {(user.name || user.email) ?? user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
            >
              Create Notification
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-700 font-semibold text-xs uppercase tracking-wider">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500">
                  No notifications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {filteredNotifications.length} notifications (total {notifications.length})
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-gray-300 hover:bg-gray-50"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-gray-300 hover:bg-gray-50"
          >
            Next
          </Button>
        </div>
      </div>

      <AddNotificationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        users={users}
        onAdd={handleAdd}
      />
      <DeleteNotificationDialog
        notification={selectedNotification}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDelete}
      />
    </div>
  )
}
