"use client"

import { useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface AddPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: { name: string; description?: string }) => Promise<void>
}

export function AddPermissionDialog({ open, onOpenChange, onAdd }: AddPermissionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onAdd({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      })
      setFormData({ name: "", description: "" })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to add permission", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Permission</DialogTitle>
            <DialogDescription className="text-gray-600">
              Define a new permission that can be assigned to roles
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="permission-name" className="text-gray-700">Name</Label>
              <Input
                id="permission-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500">Use a unique, descriptive name (e.g. manage_users)</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="permission-description" className="text-gray-700">Description</Label>
              <Textarea
                id="permission-description"
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
                  Creating...
                </>
              ) : (
                "Create Permission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
