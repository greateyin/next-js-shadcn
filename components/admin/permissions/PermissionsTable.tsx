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
import { PlusCircle, ShieldCheck, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddPermissionDialog } from "./AddPermissionDialog"
import { EditPermissionDialog } from "./EditPermissionDialog"
import { DeletePermissionDialog } from "./DeletePermissionDialog"

interface PermissionRow {
  id: string
  name: string
  description: string
  createdAt: string
  roleCount: number
  roles: string[]
}

interface PermissionResponse {
  id: string
  name: string
  description: string | null
  createdAt: string | Date
  roles?: unknown
}

const normalizePermissionRoles = (roles: unknown): string[] => {
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

interface PermissionsTableProps {
  permissions: PermissionRow[]
}

export function PermissionsTable({ permissions: initialPermissions }: PermissionsTableProps) {
  const router = useRouter()
  const [permissions, setPermissions] = useState(initialPermissions)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<PermissionRow | null>(null)

  useEffect(() => {
    setPermissions(initialPermissions)
  }, [initialPermissions])

  const handleAdd = async (data: { name: string; description?: string }) => {
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create permission')
      }

      const response = await res.json() as { permission?: PermissionResponse }
      const permission = response.permission
      if (!permission) {
        throw new Error('Missing permission in response')
      }

      const roles = normalizePermissionRoles(permission.roles)
        const formatted: PermissionRow = {
          id: permission.id,
          name: permission.name,
          description: permission.description || 'No description',
          createdAt:
            typeof permission.createdAt === 'string'
              ? permission.createdAt
              : permission.createdAt.toISOString(),
          roleCount: roles.length,
          roles,
        }

        setPermissions((prev) => [formatted, ...prev])
      toast.success('Permission created successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create permission'
      toast.error(message)
    }
  }

  const handleEdit = async (
    permissionId: string,
    data: { name: string; description?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update permission')
      }

      const response = await res.json() as { permission?: PermissionResponse }
      const permission = response.permission
      if (!permission) {
        throw new Error('Missing permission in response')
      }

      setPermissions((prev) =>
        prev.map((perm) =>
          perm.id === permissionId
            ? {
                ...perm,
                name: permission.name,
                description: permission.description || 'No description',
              }
            : perm
        )
      )

      toast.success('Permission updated successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update permission'
      toast.error(message)
    }
  }

  const handleDelete = async (permissionId: string) => {
    try {
      const res = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete permission')
      }

      setPermissions((prev) => prev.filter((perm) => perm.id !== permissionId))
      toast.success('Permission deleted successfully')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete permission'
      toast.error(message)
    }
  }

  const columns: ColumnDef<PermissionRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-900">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return description ? description : <span className="text-gray-500">No description</span>
      },
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const roles = row.original.roles
        if (!roles.length) {
          return <span className="text-gray-500">Not assigned</span>
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[280px]">
            {roles.map((role) => (
              <Badge key={`${row.original.id}-${role}`} variant="secondary" className="bg-gray-100 text-gray-700">
                {role}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "roleCount",
      header: "Role Count",
      cell: ({ row }) => row.original.roleCount,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return date.toLocaleDateString()
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const permission = row.original
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
                  setSelectedPermission(permission)
                  setEditDialogOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50 px-3 py-2 text-red-600"
                onClick={() => {
                  setSelectedPermission(permission)
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
    data: permissions,
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
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm border-gray-300 focus:border-blue-500"
        />
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Permission
        </Button>
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  No permissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {permissions.length} permissions
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

      <AddPermissionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
      <EditPermissionDialog
        permission={selectedPermission}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEdit}
      />
      <DeletePermissionDialog
        permission={selectedPermission}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDelete}
      />
    </div>
  )
}
