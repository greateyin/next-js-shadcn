"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, Shield } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Permission {
  id: string
  name: string
  description: string | null
}

interface Role {
  id: string
  name: string
  permissions: string
}

interface ManagePermissionsDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roleId: string, permissionIds: string[]) => Promise<void>
}

/**
 * ManagePermissionsDialog - Apple Style
 * 管理角色權限對話框
 */
export function ManagePermissionsDialog({ role, open, onOpenChange, onSave }: ManagePermissionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // Load all permissions when dialog opens
  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    setLoadingPermissions(true)
    try {
      const res = await fetch("/api/admin/permissions")
      if (res.ok) {
        const data = await res.json()
        setAllPermissions(data.permissions || [])
        
        // Load current role permissions
        if (role) {
          const roleRes = await fetch(`/api/admin/roles/${role.id}/permissions`)
          if (roleRes.ok) {
            const roleData = await roleRes.json()
            setSelectedPermissions(roleData.permissionIds || [])
          }
        }
      }
    } catch (error) {
      console.error("Failed to load permissions:", error)
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPermissions.length === allPermissions.length) {
      setSelectedPermissions([])
    } else {
      setSelectedPermissions(allPermissions.map(p => p.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    try {
      await onSave(role.id, selectedPermissions)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const category = perm.name.split(':')[0] || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-gray-900">Manage Permissions</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Configure permissions for <span className="font-semibold text-gray-900">{role?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="py-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedPermissions.length} of {allPermissions.length} selected
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {selectedPermissions.length === allPermissions.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start space-x-3 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handleTogglePermission(permission.id)}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor={permission.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium text-gray-900">{permission.name}</div>
                              {permission.description && (
                                <div className="text-xs text-gray-500 mt-0.5">{permission.description}</div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 hover:bg-gray-50"
              disabled={loading || loadingPermissions}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
              disabled={loading || loadingPermissions}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
