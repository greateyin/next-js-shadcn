'use client'

import { useState } from "react"
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
import { 
  MoreHorizontal, 
  PlusCircle, 
  Edit, 
  Power, 
  Shield, 
  Menu, 
  Trash2,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ApplicationFormDialog } from "./ApplicationFormDialog"
import { ManageRolesDialog } from "./ManageRolesDialog"
import { toggleApplicationStatus, deleteApplication } from "@/actions/application"

interface Application {
  id: string
  name: string
  displayName: string
  description: string
  path: string
  icon: string | null
  isActive: boolean
  roles: Array<{
    role: {
      id: string
      name: string
      description: string | null
    }
  }>
  menuItemCount: number
  order: number
  createdAt: string
}

interface ApplicationsTableProps {
  applications: Application[]
  availableRoles: Array<{
    id: string
    name: string
    description: string | null
  }>
  onRefresh: () => void
}

export function ApplicationsTable({ applications, availableRoles, onRefresh }: ApplicationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "displayName",
      header: "Display Name",
      cell: ({ row }) => <div>{row.getValue("displayName")}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "path",
      header: "Path",
      cell: ({ row }) => <div>/{row.getValue("path")}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const app = row.original
        const roleNames = app.roles.map((ra) => ra.role.name).join(", ")
        return (
          <div className="max-w-[200px] truncate" title={roleNames}>
            {roleNames || "No roles"}
          </div>
        )
      },
    },
    {
      accessorKey: "menuItemCount",
      header: "Menu Items",
      cell: ({ row }) => <div>{row.getValue("menuItemCount")}</div>,
    },
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => <div>{row.getValue("order")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const app = row.original

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
                  setSelectedApplication(app)
                  setIsFormDialogOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-green-50 focus:bg-green-50 px-3 py-2"
                onClick={async () => {
                  const result = await toggleApplicationStatus({
                    id: app.id,
                    isActive: !app.isActive,
                  })
                  if (result.error) {
                    toast.error(result.error)
                  } else if (result.success) {
                    toast.success(result.success)
                    onRefresh()
                  }
                }}
              >
                <Power className="mr-2 h-4 w-4" />
                {app.isActive ? "Disable" : "Enable"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-purple-50 focus:bg-purple-50 px-3 py-2"
                onClick={() => {
                  setSelectedApplication(app)
                  setIsRolesDialogOpen(true)
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Manage Role Access
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50 px-3 py-2 text-red-600"
                onClick={() => {
                  setSelectedApplication(app)
                  setIsDeleteDialogOpen(true)
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
    data: applications,
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

  const handleDelete = async () => {
    if (!selectedApplication) return

    setIsDeleting(true)
    try {
      const result = await deleteApplication({ id: selectedApplication.id })
      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success(result.success)
        setIsDeleteDialogOpen(false)
        setSelectedApplication(null)
        onRefresh()
      }
    } catch (error) {
      console.error("[DELETE_APPLICATION]", error)
      toast.error("刪除應用程式時發生錯誤")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <Input
            placeholder="Filter by application name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm border-gray-300 focus:border-blue-500"
          />
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
            onClick={() => {
              setSelectedApplication(null)
              setIsFormDialogOpen(true)
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Application
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
                  No applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {applications.length} applications
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
      </div>

      {/* 新增/編輯應用程式對話框 */}
      <ApplicationFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        application={selectedApplication ? {
          id: selectedApplication.id,
          name: selectedApplication.name,
          displayName: selectedApplication.displayName,
          description: selectedApplication.description,
          path: selectedApplication.path,
          icon: selectedApplication.icon,
          order: selectedApplication.order,
          isActive: selectedApplication.isActive,
        } : undefined}
        onSuccess={onRefresh}
      />

      {/* 管理角色存取對話框 */}
      {selectedApplication && (
        <ManageRolesDialog
          open={isRolesDialogOpen}
          onOpenChange={setIsRolesDialogOpen}
          applicationId={selectedApplication.id}
          applicationName={selectedApplication.displayName}
          currentRoleIds={selectedApplication.roles.map((ra) => ra.role.id)}
          availableRoles={availableRoles}
          onSuccess={onRefresh}
        />
      )}

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedApplication?.displayName}"? This action cannot be undone.
              {selectedApplication && (
                <>
                  {selectedApplication.menuItemCount > 0 && (
                    <div className="mt-2 text-red-600">
                      Warning: This application has {selectedApplication.menuItemCount} associated menu items.
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}