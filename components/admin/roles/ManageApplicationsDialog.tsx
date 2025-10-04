"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, Layout } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Application {
  id: string
  name: string
  displayName: string
  description: string | null
  path: string
  icon: string | null
  isActive: boolean
}

interface Role {
  id: string
  name: string
}

interface ManageApplicationsDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roleId: string, applicationIds: string[]) => Promise<void>
}

/**
 * ManageApplicationsDialog - Apple Style
 * 管理角色應用訪問對話框
 */
export function ManageApplicationsDialog({ role, open, onOpenChange, onSave }: ManageApplicationsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])

  // Load all applications when dialog opens
  useEffect(() => {
    if (open) {
      loadApplications()
    }
  }, [open])

  const loadApplications = async () => {
    setLoadingApplications(true)
    try {
      const res = await fetch("/api/admin/applications")
      if (res.ok) {
        const data = await res.json()
        setAllApplications(data.applications || [])
        
        // Load current role applications
        if (role) {
          const roleRes = await fetch(`/api/admin/roles/${role.id}/applications`)
          if (roleRes.ok) {
            const roleData = await roleRes.json()
            setSelectedApplications(roleData.applicationIds || [])
          }
        }
      }
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleToggleApplication = (applicationId: string) => {
    setSelectedApplications(prev =>
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const handleSelectAll = () => {
    const activeApps = allApplications.filter(app => app.isActive)
    if (selectedApplications.length === activeApps.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(activeApps.map(app => app.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    try {
      await onSave(role.id, selectedApplications)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeApplications = allApplications.filter(app => app.isActive)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Layout className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-gray-900">Manage Application Access</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Configure which applications <span className="font-semibold text-gray-900">{role?.name}</span> can access
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {loadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="py-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedApplications.length} of {activeApplications.length} selected
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {selectedApplications.length === activeApplications.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {activeApplications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No active applications found
                    </div>
                  ) : (
                    activeApplications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-start space-x-3 rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          id={application.id}
                          checked={selectedApplications.includes(application.id)}
                          onCheckedChange={() => handleToggleApplication(application.id)}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={application.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900">{application.displayName}</div>
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {application.name}
                            </span>
                          </div>
                          {application.description && (
                            <div className="text-sm text-gray-600 mt-1">{application.description}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Path: <span className="font-mono">{application.path}</span>
                          </div>
                        </Label>
                      </div>
                    ))
                  )}
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
              disabled={loading || loadingApplications}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-sm"
              disabled={loading || loadingApplications}
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
