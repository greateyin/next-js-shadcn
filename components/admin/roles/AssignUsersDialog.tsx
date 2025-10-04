"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface User {
  id: string
  name: string
  email: string
  status: string
}

interface Role {
  id: string
  name: string
}

interface AssignUsersDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roleId: string, userIds: string[]) => Promise<void>
}

/**
 * AssignUsersDialog - Apple Style
 * 分配用戶到角色對話框
 */
export function AssignUsersDialog({ role, open, onOpenChange, onSave }: AssignUsersDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Load all users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
        
        // Load current role users
        if (role) {
          const roleRes = await fetch(`/api/admin/roles/${role.id}/users`)
          if (roleRes.ok) {
            const roleData = await roleRes.json()
            setSelectedUsers(roleData.userIds || [])
          }
        }
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    try {
      await onSave(role.id, selectedUsers)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update users:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users by search term
  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-gray-900">Assign Users</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Assign users to <span className="font-semibold text-gray-900">{role?.name}</span> role
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="py-6">
              <div className="space-y-4 mb-4">
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="text-sm text-gray-600">
                    {selectedUsers.length} of {filteredUsers.length} selected
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-start space-x-3 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          id={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={user.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">{user.name || "No name"}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Status: <span className="capitalize">{user.status}</span>
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
              disabled={loading || loadingUsers}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
              disabled={loading || loadingUsers}
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
