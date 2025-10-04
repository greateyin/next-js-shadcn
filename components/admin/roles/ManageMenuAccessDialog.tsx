"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Menu as MenuIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MenuItem {
  id: string
  name: string
  displayName: string
  description: string | null
  path: string
  icon: string | null
  applicationName: string
}

interface MenuAccess {
  menuItemId: string
  canView: boolean
  canAccess: boolean
}

interface Role {
  id: string
  name: string
}

interface ManageMenuAccessDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roleId: string, menuAccess: MenuAccess[]) => Promise<void>
}

/**
 * ManageMenuAccessDialog - Apple Style
 * 管理角色選單訪問對話框
 */
export function ManageMenuAccessDialog({ role, open, onOpenChange, onSave }: ManageMenuAccessDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([])
  const [menuAccess, setMenuAccess] = useState<Record<string, MenuAccess>>({})

  // Load all menu items when dialog opens
  useEffect(() => {
    if (open) {
      loadMenuItems()
    }
  }, [open])

  const loadMenuItems = async () => {
    setLoadingMenus(true)
    try {
      const res = await fetch("/api/admin/menu-items")
      if (res.ok) {
        const data = await res.json()
        setAllMenuItems(data.menuItems || [])
        
        // Load current role menu access
        if (role) {
          const roleRes = await fetch(`/api/admin/roles/${role.id}/menu-access`)
          if (roleRes.ok) {
            const roleData = await roleRes.json()
            const accessMap: Record<string, MenuAccess> = {}
            roleData.menuAccess?.forEach((access: MenuAccess) => {
              accessMap[access.menuItemId] = access
            })
            setMenuAccess(accessMap)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load menu items:", error)
    } finally {
      setLoadingMenus(false)
    }
  }

  const handleToggleMenu = (menuItemId: string) => {
    setMenuAccess(prev => {
      const newAccess = { ...prev }
      if (newAccess[menuItemId]) {
        delete newAccess[menuItemId]
      } else {
        newAccess[menuItemId] = {
          menuItemId,
          canView: true,
          canAccess: true
        }
      }
      return newAccess
    })
  }

  const handleToggleView = (menuItemId: string) => {
    setMenuAccess(prev => ({
      ...prev,
      [menuItemId]: {
        ...prev[menuItemId],
        menuItemId,
        canView: !prev[menuItemId]?.canView,
        canAccess: prev[menuItemId]?.canAccess ?? true
      }
    }))
  }

  const handleToggleAccess = (menuItemId: string) => {
    setMenuAccess(prev => ({
      ...prev,
      [menuItemId]: {
        ...prev[menuItemId],
        menuItemId,
        canView: prev[menuItemId]?.canView ?? true,
        canAccess: !prev[menuItemId]?.canAccess
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    try {
      const accessArray = Object.values(menuAccess).filter(access =>
        access.canView || access.canAccess
      )
      await onSave(role.id, accessArray)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update menu access:", error)
    } finally {
      setLoading(false)
    }
  }

  // Group menu items by application
  const groupedMenus = allMenuItems.reduce((acc, item) => {
    if (!acc[item.applicationName]) acc[item.applicationName] = []
    acc[item.applicationName].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <MenuIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-gray-900">Manage Menu Access</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Configure menu visibility and access for <span className="font-semibold text-gray-900">{role?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {loadingMenus ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : (
            <div className="py-6">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-600">
                  {Object.keys(menuAccess).length} menu items configured
                </div>
              </div>
              
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-6">
                  {Object.entries(groupedMenus).map(([appName, menus]) => (
                    <div key={appName} className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        {appName}
                      </h3>
                      <div className="space-y-2">
                        {menus.map((menuItem) => {
                          const access = menuAccess[menuItem.id]
                          const isConfigured = !!access
                          
                          return (
                            <div
                              key={menuItem.id}
                              className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`menu-${menuItem.id}`}
                                  checked={isConfigured}
                                  onCheckedChange={() => handleToggleMenu(menuItem.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`menu-${menuItem.id}`}
                                    className="cursor-pointer"
                                  >
                                    <div className="font-medium text-gray-900">{menuItem.displayName}</div>
                                    {menuItem.description && (
                                      <div className="text-sm text-gray-500 mt-0.5">{menuItem.description}</div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1 font-mono">{menuItem.path}</div>
                                  </Label>
                                  
                                  {isConfigured && (
                                    <div className="mt-3 flex gap-6">
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          id={`view-${menuItem.id}`}
                                          checked={access?.canView ?? true}
                                          onCheckedChange={() => handleToggleView(menuItem.id)}
                                          className="scale-75"
                                        />
                                        <Label htmlFor={`view-${menuItem.id}`} className="text-sm text-gray-700 cursor-pointer">
                                          Can View
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          id={`access-${menuItem.id}`}
                                          checked={access?.canAccess ?? true}
                                          onCheckedChange={() => handleToggleAccess(menuItem.id)}
                                          className="scale-75"
                                        />
                                        <Label htmlFor={`access-${menuItem.id}`} className="text-sm text-gray-700 cursor-pointer">
                                          Can Access
                                        </Label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
              disabled={loading || loadingMenus}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm"
              disabled={loading || loadingMenus}
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
