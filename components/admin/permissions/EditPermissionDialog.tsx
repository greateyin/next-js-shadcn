"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface PermissionRow {
  id: string
  name: string
  description: string
}

interface EditPermissionDialogProps {
  permission: PermissionRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (permissionId: string, data: { name: string; description?: string }) => Promise<void>
}

export function EditPermissionDialog({ permission, open, onOpenChange, onSave }: EditPermissionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name,
        description: permission.description === "No description" ? "" : permission.description,
      })
    }
  }, [permission])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!permission) return

    setLoading(true)
    try {
      await onSave(permission.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update permission", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Permission</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update permission details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="edit-permission-name" className="text-gray-700">Name</Label>
              <Input
                id="edit-permission-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-permission-description" className="text-gray-700">Description</Label>
              <Textarea
                id="edit-permission-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                rows={4}
                placeholder="Describe what this permission allows."
              />
            </div>
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
