"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, X } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  status: string
  roles: string
  image?: string
  isTwoFactorEnabled?: boolean
  emailVerified?: string | null
  loginAttempts?: number
  phoneNumber?: string
  loginMethods?: string[]
}

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (userId: string, data: {
    name: string
    email: string
    status: string
    image?: string
    isTwoFactorEnabled: boolean
    emailVerified: boolean
    loginAttempts: number
    phoneNumber?: string
    loginMethods: string[]
  }) => Promise<void>
}

/**
 * EditUserDialog - Apple Style
 * User edit dialog
 */
export function EditUserDialog({ user, open, onOpenChange, onSave }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newMethod, setNewMethod] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "active",
    image: "",
    isTwoFactorEnabled: false,
    emailVerified: false,
    loginAttempts: 0,
    phoneNumber: "",
    loginMethods: [] as string[],
  })

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        status: user.status || "active",
        image: user.image || "",
        isTwoFactorEnabled: user.isTwoFactorEnabled || false,
        emailVerified: !!user.emailVerified,
        loginAttempts: user.loginAttempts || 0,
        phoneNumber: user.phoneNumber || "",
        loginMethods: user.loginMethods || [],
      })
    }
  }, [user])

  const addLoginMethod = () => {
    const value = newMethod.trim()
    if (!value) return
    if (formData.loginMethods.includes(value)) {
      setNewMethod("")
      return
    }
    setFormData({
      ...formData,
      loginMethods: [...formData.loginMethods, value],
    })
    setNewMethod("")
  }

  const removeLoginMethod = (method: string) => {
    setFormData({
      ...formData,
      loginMethods: formData.loginMethods.filter((m) => m !== method),
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await onSave(user.id, {
        ...formData,
        loginMethods: formData.loginMethods.map((method) => method.trim()).filter(Boolean),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update user information and settings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-700">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                placeholder="Optional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image" className="text-gray-700">Avatar URL</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-gray-700">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Security Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Security Settings</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailVerified" className="text-gray-700">Email Verified</Label>
                  <p className="text-sm text-gray-500">Mark email as verified</p>
                </div>
                <Switch
                  id="emailVerified"
                  checked={formData.emailVerified}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailVerified: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactor" className="text-gray-700">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Enable 2FA for this user</p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={formData.isTwoFactorEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTwoFactorEnabled: checked })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="loginAttempts" className="text-gray-700">Login Attempts</Label>
                <div className="flex gap-2">
                  <Input
                    id="loginAttempts"
                    type="number"
                    min="0"
                    value={formData.loginAttempts}
                    onChange={(e) => setFormData({ ...formData, loginAttempts: parseInt(e.target.value) || 0 })}
                    className="border-gray-300 focus:border-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, loginAttempts: 0 })}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Failed login attempts (automatically locks at 5)</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <Label className="text-gray-700">Login Methods</Label>
              <div className="flex gap-2">
                <Input
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  placeholder="Add method (e.g. password, google)"
                  className="border-gray-300 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addLoginMethod()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addLoginMethod} className="border-gray-300">
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500">Add or remove allowed authentication methods for this account.</p>
              <div className="flex flex-wrap gap-2">
                {formData.loginMethods.map((method) => (
                  <Badge
                    key={method}
                    variant="secondary"
                    className="flex items-center gap-1 bg-gray-100 text-gray-700"
                  >
                    {method}
                    <button
                      type="button"
                      onClick={() => removeLoginMethod(method)}
                      className="rounded-full p-0.5 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
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
