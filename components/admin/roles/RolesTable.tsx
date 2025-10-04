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
import { MoreHorizontal, PlusCircle, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddRoleDialog } from "./AddRoleDialog"
import { EditRoleDialog } from "./EditRoleDialog"
import { DeleteRoleDialog } from "./DeleteRoleDialog"
import { ManagePermissionsDialog } from "./ManagePermissionsDialog"
import { AssignUsersDialog } from "./AssignUsersDialog"
import { ManageApplicationsDialog } from "./ManageApplicationsDialog"
import { ManageMenuAccessDialog } from "./ManageMenuAccessDialog"

interface Role {
  id: string
  name: string
  description: string
  permissions: string
  userCount: number
  applicationCount: number
  createdAt: string
}

interface RolesTableProps {
  roles: Role[]
}

export function RolesTable({ roles: initialRoles }: RolesTableProps) {
  const router = useRouter()
  const [roles, setRoles] = useState(initialRoles)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  
  // Update roles when initialRoles changes
  useEffect(() => {
    setRoles(initialRoles)
  }, [initialRoles])
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [usersDialogOpen, setUsersDialogOpen] = useState(false)
  const [applicationsDialogOpen, setApplicationsDialogOpen] = useState(false)
  const [menuAccessDialogOpen, setMenuAccessDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  // API handlers
  const handleAdd = async (data: { name: string; description: string }) => {
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create role")
      }
      
      const { role } = await res.json()
      
      // Add new role to the list
      const formattedRole = {
        id: role.id,
        name: role.name,
        description: role.description || "No description",
        permissions: role.permissions?.map((rp: any) => rp.permission.name).join(", ") || "No permissions",
        userCount: role._count?.users || 0,
        applicationCount: role._count?.applications || 0,
        createdAt: new Date(role.createdAt).toISOString()
      }
      
      setRoles([formattedRole, ...roles])
      toast.success("Role created successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to create role")
    }
  }
  
  const handleEdit = async (roleId: string, data: { name: string; description: string }) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error("Failed to update role")
      
      // Update role in the list
      setRoles(roles.map(r => 
        r.id === roleId 
          ? { ...r, name: data.name, description: data.description }
          : r
      ))
      
      toast.success("Role updated successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update role")
    }
  }
  
  const handleDelete = async (roleId: string) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE"
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete role")
      }
      
      // Remove role from the list
      setRoles(roles.filter(r => r.id !== roleId))
      
      toast.success("Role deleted successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role")
    }
  }
  
  const handleManagePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds })
      })
      
      if (!res.ok) throw new Error("Failed to update permissions")
      
      toast.success("Permissions updated successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update permissions")
    }
  }
  
  const handleAssignUsers = async (roleId: string, userIds: string[]) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds })
      })
      
      if (!res.ok) throw new Error("Failed to assign users")
      
      toast.success("Users assigned successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to assign users")
    }
  }
  
  const handleManageApplications = async (roleId: string, applicationIds: string[]) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/applications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds })
      })
      
      if (!res.ok) throw new Error("Failed to update applications")
      
      toast.success("Application access updated successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update application access")
    }
  }
  
  const handleManageMenuAccess = async (roleId: string, menuAccess: any[]) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/menu-access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuAccess })
      })
      
      if (!res.ok) throw new Error("Failed to update menu access")
      
      toast.success("Menu access updated successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update menu access")
    }
  }

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => <div className="truncate max-w-xs" title={row.getValue("permissions")}>{row.getValue("permissions")}</div>,
    },
    {
      accessorKey: "userCount",
      header: "Users",
      cell: ({ row }) => <div>{row.getValue("userCount")}</div>,
    },
    {
      accessorKey: "applicationCount",
      header: "Applications",
      cell: ({ row }) => <div>{row.getValue("applicationCount")}</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return date.toISOString().split('T')[0]
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const role = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-gray-200/50 shadow-xl bg-white/95 backdrop-blur-xl p-2">
              <DropdownMenuLabel className="px-3 py-2 font-semibold text-gray-900">Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2"
                onClick={() => {
                  setSelectedRole(role)
                  setEditDialogOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-blue-50 focus:bg-blue-50 px-3 py-2"
                onClick={() => {
                  setSelectedRole(role)
                  setPermissionsDialogOpen(true)
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2"
                onClick={() => {
                  setSelectedRole(role)
                  setUsersDialogOpen(true)
                }}
              >
                Assign Users
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-purple-50 focus:bg-purple-50 px-3 py-2"
                onClick={() => {
                  setSelectedRole(role)
                  setApplicationsDialogOpen(true)
                }}
              >
                Set Application Access
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-green-50 focus:bg-green-50 px-3 py-2"
                onClick={() => {
                  setSelectedRole(role)
                  setMenuAccessDialogOpen(true)
                }}
              >
                Manage Menu Access
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50 px-3 py-2 text-red-600"
                onClick={() => {
                  setSelectedRole(role)
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
    data: roles,
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
          placeholder="Filter by role name..."
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
          Add Role
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
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {roles.length} roles
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
      <AddRoleDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
      
      <EditRoleDialog
        role={selectedRole}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEdit}
      />
      
      <DeleteRoleDialog
        role={selectedRole}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDelete}
      />
      
      <ManagePermissionsDialog
        role={selectedRole}
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        onSave={handleManagePermissions}
      />
      
      <AssignUsersDialog
        role={selectedRole}
        open={usersDialogOpen}
        onOpenChange={setUsersDialogOpen}
        onSave={handleAssignUsers}
      />
      
      <ManageApplicationsDialog
        role={selectedRole}
        open={applicationsDialogOpen}
        onOpenChange={setApplicationsDialogOpen}
        onSave={handleManageApplications}
      />
      
      <ManageMenuAccessDialog
        role={selectedRole}
        open={menuAccessDialogOpen}
        onOpenChange={setMenuAccessDialogOpen}
        onSave={handleManageMenuAccess}
      />
    </div>
  )
}