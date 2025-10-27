'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditUserDialog } from "./EditUserDialog"
import { AddUserDialog } from "./AddUserDialog"
import { DeleteUserDialog } from "./DeleteUserDialog"

interface User {
  id: string
  name: string
  email: string
  status: string
  roles: string
  createdAt: string
  image?: string
  isTwoFactorEnabled?: boolean
  emailVerified?: string | null
  loginAttempts?: number
  phoneNumber?: string
  loginMethods?: string[]
}

interface UsersTableProps {
  users: User[]
}

const normalizeLoginMethods = (methods: unknown): string[] => {
  if (!Array.isArray(methods)) {
    return []
  }

  return methods
    .map((method) => {
      if (typeof method === 'string') {
        return method
      }

      if (method && typeof method === 'object' && 'method' in method) {
        const value = (method as { method?: unknown }).method
        return typeof value === 'string' ? value : null
      }

      return null
    })
    .filter((value): value is string => Boolean(value))
}

const extractRoleNames = (roles: unknown): string[] => {
  if (!Array.isArray(roles)) {
    return []
  }

  return roles
    .map((roleRelation) => {
      if (roleRelation && typeof roleRelation === 'object' && 'role' in roleRelation) {
        const role = (roleRelation as { role?: { name?: unknown } }).role
        return typeof role?.name === 'string' ? role.name : null
      }

      return null
    })
    .filter((value): value is string => Boolean(value))
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Update users when initialUsers changes
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // API handlers
  const handleEdit = async (userId: string, data: {
    name: string
    email: string
    status: string
    image?: string
    isTwoFactorEnabled: boolean
    emailVerified: boolean
    loginAttempts: number
    phoneNumber?: string
    loginMethods: string[]
  }) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to update user")

      const response = await res.json() as { user?: {
        id: string
        name?: string | null
        email: string
        status?: string | null
        phoneNumber?: string | null
        image?: string | null
        isTwoFactorEnabled?: boolean | null
        emailVerified?: string | null
        loginAttempts?: number | null
        loginMethods?: unknown
      } }

      const updatedUser = response.user
      if (!updatedUser) {
        throw new Error('Missing user in update response')
      }

      const normalizedMethods = normalizeLoginMethods(updatedUser.loginMethods)

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                name: updatedUser.name || data.name,
                email: updatedUser.email || data.email,
                status: updatedUser.status || data.status,
                phoneNumber: updatedUser.phoneNumber || data.phoneNumber || '',
                isTwoFactorEnabled: updatedUser.isTwoFactorEnabled ?? data.isTwoFactorEnabled,
                emailVerified: updatedUser.emailVerified,
                loginAttempts: updatedUser.loginAttempts ?? data.loginAttempts,
                loginMethods: normalizedMethods.length ? normalizedMethods : data.loginMethods,
              }
            : u
        )
      )

      toast.success('User updated successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user'
      toast.error(message)
    }
  }

  const handleAdd = async (data: {
    name: string
    email: string
    password: string
    status: string
    phoneNumber?: string
    isTwoFactorEnabled: boolean
    emailVerified: boolean
    loginMethods: string[]
  }) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || error.error || 'Failed to create user')
      }

      const response = await res.json() as { user?: {
        id: string
        name?: string | null
        email: string
        status: string
        createdAt: string | Date
        image?: string | null
        isTwoFactorEnabled?: boolean | null
        emailVerified?: string | null
        loginAttempts?: number | null
        phoneNumber?: string | null
        userRoles?: unknown
        loginMethods?: unknown
      } }

      const createdUser = response.user
      if (!createdUser) {
        throw new Error('Missing user in create response')
      }

      const roleNames = extractRoleNames(createdUser.userRoles)
      const loginMethods = normalizeLoginMethods(createdUser.loginMethods)

      const formattedUser: User = {
        id: createdUser.id,
        name: createdUser.name || data.name,
        email: createdUser.email,
        status: createdUser.status,
        roles: roleNames.length ? roleNames.join(', ') : 'No roles',
        createdAt: new Date(createdUser.createdAt).toISOString(),
        image: createdUser.image || undefined,
        isTwoFactorEnabled: createdUser.isTwoFactorEnabled ?? false,
        emailVerified: createdUser.emailVerified || null,
        loginAttempts: createdUser.loginAttempts ?? 0,
        phoneNumber: createdUser.phoneNumber || '',
        loginMethods: loginMethods.length ? loginMethods : data.loginMethods,
      }

      setUsers((prev) => [formattedUser, ...prev])
      toast.success('User created successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user'
      toast.error(message)
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete user")

      // Remove user from the list
      setUsers((prev) => prev.filter((u) => u.id !== userId))

      toast.success("User deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.phoneNumber
        return phone ? (
          <span>{phone}</span>
        ) : (
          <span className="text-gray-500">Not set</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string

        // Apple-style status colors
        let badgeClass = ""
        let variant: "default" | "secondary" | "destructive" | "outline" = "default"

        switch(status.toLowerCase()) {
          case "active":
            badgeClass = "bg-green-500 hover:bg-green-600 text-white border-0"
            variant = "default"
            break
          case "pending":
            badgeClass = "bg-amber-500 hover:bg-amber-600 text-white border-0"
            variant = "default"
            break
          case "suspended":
            badgeClass = "bg-orange-500 hover:bg-orange-600 text-white border-0"
            variant = "default"
            break
          case "banned":
            badgeClass = "bg-red-500 hover:bg-red-600 text-white border-0"
            variant = "destructive"
            break
          case "inactive":
            badgeClass = "bg-gray-400 hover:bg-gray-500 text-white border-0"
            variant = "secondary"
            break
          default:
            badgeClass = "bg-gray-500 hover:bg-gray-600 text-white border-0"
            variant = "secondary"
        }

        return (
          <Badge variant={variant} className={badgeClass}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isTwoFactorEnabled",
      header: "2FA",
      cell: ({ row }) => {
        const enabled = row.original.isTwoFactorEnabled
        return (
          <Badge
            variant="secondary"
            className={enabled ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "loginMethods",
      header: "Login Methods",
      cell: ({ row }) => {
        const methods = row.original.loginMethods ?? []
        if (!methods.length) {
          return <span className="text-gray-500">None</span>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {methods.map((method) => (
              <Badge
                key={`${row.original.id}-${method}`}
                variant="secondary"
                className="bg-gray-100 text-gray-700"
              >
                {method}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => <div>{row.getValue("roles")}</div>,
    },
    {
      accessorKey: "loginAttempts",
      header: "Login Attempts",
      cell: ({ row }) => {
        const attempts = row.original.loginAttempts ?? 0
        return attempts > 0 ? attempts : <span className="text-gray-500">0</span>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return date.toISOString().split('T')[0]
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original

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
                onClick={() => {
                  setSelectedUser(user)
                  setEditDialogOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50 px-3 py-2 text-red-600"
                onClick={() => {
                  setSelectedUser(user)
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
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
        <Input
          placeholder="Filter by email..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm border-gray-300 focus:border-blue-500"
        />
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-gray-700 font-semibold text-xs uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {users.length} users
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

      {/* Dialogs */}
      <EditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEdit}
      />

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDelete}
      />
    </div>
  )
}
