"use client"

import { useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, X } from "lucide-react"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: {
    name: string
    email: string
    password: string
    status: string
    phoneNumber?: string
    isTwoFactorEnabled: boolean
    emailVerified: boolean
    loginMethods: string[]
  }) => Promise<void>
}

/**
 * AddUserDialog - Apple Style
 * Add user dialog
 */
export function AddUserDialog({ open, onOpenChange, onAdd }: AddUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newMethod, setNewMethod] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    status: "pending",
    phoneNumber: "",
    isTwoFactorEnabled: false,
    emailVerified: false,
    loginMethods: ["password"] as string[],
  })

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
    setLoading(true)
    try {
      await onAdd({
        ...formData,
        loginMethods: formData.loginMethods.map((method) => method.trim()).filter(Boolean),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      })
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        status: "pending",
        phoneNumber: "",
        isTwoFactorEnabled: false,
        emailVerified: false,
        loginMethods: ["password"],
      })
      setNewMethod("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to add user:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add New User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new user account
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="new-name" className="text-gray-700">Name</Label>
              <Input
                id="new-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-email" className="text-gray-700">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-phone" className="text-gray-700">Phone Number</Label>
              <Input
                id="new-phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                placeholder="Optional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-password" className="text-gray-700">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-status" className="text-gray-700">Status</Label>
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

            <div className="grid gap-4 rounded-xl border border-gray-200/70 bg-gray-50/60 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Security Settings</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-email-verified" className="text-gray-700">Email Verified</Label>
                  <p className="text-xs text-gray-500">Mark email as verified on creation</p>
                </div>
                <Switch
                  id="new-email-verified"
                  checked={formData.emailVerified}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailVerified: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-two-factor" className="text-gray-700">Two-Factor Authentication</Label>
                  <p className="text-xs text-gray-500">Require 2FA for this user</p>
                </div>
                <Switch
                  id="new-two-factor"
                  checked={formData.isTwoFactorEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTwoFactorEnabled: checked })}
                />
              </div>
            </div>

            <div className="grid gap-2">
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
              <p className="text-xs text-gray-500">"password" method is required when setting a password.</p>
              <div className="flex flex-wrap gap-2">
                {formData.loginMethods.map((method) => (
                  <Badge
                    key={method}
                    variant="secondary"
                    className="flex items-center gap-1 bg-gray-100 text-gray-700"
                  >
                    {method}
                    {method !== "password" && (
                      <button
                        type="button"
                        onClick={() => removeLoginMethod(method)}
                        className="rounded-full p-0.5 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
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
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
