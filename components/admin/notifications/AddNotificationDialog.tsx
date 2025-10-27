"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { NotificationType } from "@/types/notifications"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NotificationUserOption {
  id: string
  name: string | null
  email: string
}

interface AddNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: NotificationUserOption[]
  onAdd: (data: {
    title: string
    message: string
    type: NotificationType
    userId?: string
    broadcast?: boolean
    metadata?: Record<string, unknown>
  }) => Promise<void>
}

export function AddNotificationDialog({ open, onOpenChange, users, onAdd }: AddNotificationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [broadcast, setBroadcast] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: NotificationType.INFO,
    userId: '' as string | undefined,
    metadata: ''
  })

  const typeOptions = useMemo(() => Object.values(NotificationType), [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let metadata: Record<string, unknown> | undefined
      if (formData.metadata.trim()) {
        try {
          const parsed = JSON.parse(formData.metadata)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            metadata = parsed as Record<string, unknown>
          } else {
            setError('Metadata must be a JSON object')
            setLoading(false)
            return
          }
        } catch {
          setError('Metadata must be valid JSON')
          setLoading(false)
          return
        }
      }

      if (!broadcast && !formData.userId) {
        setError('Please select a recipient or send as broadcast')
        setLoading(false)
        return
      }

      await onAdd({
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        userId: broadcast ? undefined : formData.userId,
        broadcast,
        metadata,
      })

      setFormData({
        title: '',
        message: '',
        type: NotificationType.INFO,
        userId: '',
        metadata: '',
      })
      setBroadcast(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create notification', error)
      setError('Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create Notification</DialogTitle>
            <DialogDescription className="text-gray-600">
              Send a notification to a specific user or broadcast it to everyone
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="notification-title" className="text-gray-700">Title</Label>
              <Input
                id="notification-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notification-message" className="text-gray-700">Message</Label>
              <Textarea
                id="notification-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                rows={4}
                required
                placeholder="Provide clear and actionable information for the recipient"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notification-type" className="text-gray-700">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as NotificationType })}
              >
                <SelectTrigger id="notification-type" className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-72 overflow-y-auto">
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/60 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="notification-broadcast" className="text-gray-700">Broadcast to all active users</Label>
                <p className="text-xs text-gray-500">Sends this notification to every active user in the system</p>
              </div>
              <Switch
                id="notification-broadcast"
                checked={broadcast}
                onCheckedChange={(checked) => {
                  setBroadcast(checked)
                  if (checked) {
                    setFormData((prev) => ({ ...prev, userId: undefined }))
                  }
                }}
              />
            </div>

            {!broadcast && (
              <div className="grid gap-2">
                <Label htmlFor="notification-user" className="text-gray-700">Recipient</Label>
                <Select
                  value={formData.userId || ''}
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                >
                  <SelectTrigger id="notification-user" className="border-gray-300">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 max-h-72 overflow-y-auto">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {(user.name || user.email) ?? user.email} — {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notification-metadata" className="text-gray-700">Metadata (JSON)</Label>
              <Textarea
                id="notification-metadata"
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                rows={3}
                placeholder='{"url": "/admin"}'
              />
              <p className="text-xs text-gray-500">Optional structured data that accompanies the notification payload.</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
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
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Notification'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
