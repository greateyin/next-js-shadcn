"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface NotificationRow {
  id: string
  title: string
}

interface DeleteNotificationDialogProps {
  notification: NotificationRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (notificationId: string) => Promise<void>
}

export function DeleteNotificationDialog({ notification, open, onOpenChange, onDelete }: DeleteNotificationDialogProps) {
  const handleDelete = async () => {
    if (!notification) return
    await onDelete(notification.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Delete Notification</DialogTitle>
          <DialogDescription className="text-gray-600">
            This action cannot be undone. The notification will be removed for all recipients.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the notification
            {" "}
            <span className="font-semibold">{notification?.title}</span>?
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
            Delete Notification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
