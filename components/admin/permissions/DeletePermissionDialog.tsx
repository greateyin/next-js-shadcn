"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PermissionRow {
  id: string
  name: string
}

interface DeletePermissionDialogProps {
  permission: PermissionRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (permissionId: string) => Promise<void>
}

export function DeletePermissionDialog({ permission, open, onOpenChange, onDelete }: DeletePermissionDialogProps) {
  const handleDelete = async () => {
    if (!permission) return
    await onDelete(permission.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Delete Permission</DialogTitle>
          <DialogDescription className="text-gray-600">
            This action cannot be undone. It will remove the permission from all roles that currently use it.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the permission
            {" "}
            <span className="font-semibold">{permission?.name}</span>?
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
