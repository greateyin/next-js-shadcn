"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
}

interface DeleteUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (userId: string) => Promise<void>
}

/**
 * DeleteUserDialog - Apple Style
 * 刪除用戶確認對話框
 */
export function DeleteUserDialog({ user, open, onOpenChange, onDelete }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!user) return

    setLoading(true)
    try {
      await onDelete(user.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete user:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white border-gray-200/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-gray-900">Delete User</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 pt-3">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{user?.name}</span> ({user?.email})?
            <br /><br />
            This action cannot be undone. All user data, sessions, and associated records will be permanently removed.
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
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
