"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  userCount: number
}

interface DeleteRoleDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (roleId: string) => Promise<void>
}

/**
 * DeleteRoleDialog - Apple Style
 * 刪除角色確認對話框
 */
export function DeleteRoleDialog({ role, open, onOpenChange, onDelete }: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!role) return

    setLoading(true)
    try {
      await onDelete(role.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete role:", error)
    } finally {
      setLoading(false)
    }
  }

  const hasUsers = role && role.userCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white border-gray-200/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-gray-900">Delete Role</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 pt-3">
            {hasUsers ? (
              <>
                <span className="font-semibold text-red-600">Warning:</span> This role is currently assigned to <span className="font-semibold text-gray-900">{role.userCount}</span> user(s).
                <br /><br />
                Deleting this role will remove it from all users. This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete the role <span className="font-semibold text-gray-900">{role?.name}</span>?
                <br /><br />
                This action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
