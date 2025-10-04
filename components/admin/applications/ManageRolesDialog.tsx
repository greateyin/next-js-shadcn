"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter, X } from "lucide-react";
import { manageApplicationRoles } from "@/actions/application";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface ManageRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  applicationName: string;
  currentRoleIds: string[];
  availableRoles: Role[];
  onSuccess?: () => void;
}

/**
 * 管理應用程式角色存取權限對話框
 */
export function ManageRolesDialog({
  open,
  onOpenChange,
  applicationId,
  applicationName,
  currentRoleIds,
  availableRoles,
  onSuccess,
}: ManageRolesDialogProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(currentRoleIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "selected" | "unselected">("all");

  // 當對話框打開或 currentRoleIds 改變時，更新選中的角色
  useEffect(() => {
    if (open) {
      setSelectedRoleIds(currentRoleIds);
      setSearchQuery(""); // 重置搜尋
      setFilterMode("all"); // 重置篩選
    }
  }, [open, currentRoleIds]);

  // 篩選後的角色列表
  const filteredRoles = useMemo(() => {
    let filtered = availableRoles;

    // 搜尋篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(query) ||
          role.description?.toLowerCase().includes(query)
      );
    }

    // 狀態篩選
    if (filterMode === "selected") {
      filtered = filtered.filter((role) => selectedRoleIds.includes(role.id));
    } else if (filterMode === "unselected") {
      filtered = filtered.filter((role) => !selectedRoleIds.includes(role.id));
    }

    return filtered;
  }, [availableRoles, searchQuery, filterMode, selectedRoleIds]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRoleIds(availableRoles.map((role) => role.id));
  };

  const handleDeselectAll = () => {
    setSelectedRoleIds([]);
  };

  const handleInvertSelection = () => {
    const allRoleIds = availableRoles.map((role) => role.id);
    const newSelection = allRoleIds.filter((id) => !selectedRoleIds.includes(id));
    setSelectedRoleIds(newSelection);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleSelectFiltered = () => {
    const filteredIds = filteredRoles.map((role) => role.id);
    const newSelection = Array.from(new Set([...selectedRoleIds, ...filteredIds]));
    setSelectedRoleIds(newSelection);
  };

  const handleDeselectFiltered = () => {
    const filteredIds = new Set(filteredRoles.map((role) => role.id));
    setSelectedRoleIds(selectedRoleIds.filter((id) => !filteredIds.has(id)));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const result = await manageApplicationRoles({
        applicationId,
        roleIds: selectedRoleIds,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("[MANAGE_ROLES]", error);
      toast.error("發生未預期的錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-white border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Manage Role Access</DialogTitle>
          <DialogDescription className="text-gray-600">
            Select roles that can access "{applicationName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 搜尋框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSubmitting}
              className="pl-9 pr-9 border-gray-300 focus:border-blue-400 focus:ring-blue-400"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 篩選器與統計 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={filterMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("all")}
                disabled={isSubmitting}
                className={filterMode === "all" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300 hover:bg-gray-50 text-gray-700"}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                All ({availableRoles.length})
              </Button>
              <Button
                type="button"
                variant={filterMode === "selected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("selected")}
                disabled={isSubmitting}
                className={filterMode === "selected" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300 hover:bg-gray-50 text-gray-700"}
              >
                Selected ({selectedRoleIds.length})
              </Button>
              <Button
                type="button"
                variant={filterMode === "unselected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("unselected")}
                disabled={isSubmitting}
                className={filterMode === "unselected" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300 hover:bg-gray-50 text-gray-700"}
              >
                Unselected ({availableRoles.length - selectedRoleIds.length})
              </Button>
            </div>
            {searchQuery && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredRoles.length} result{filteredRoles.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* 批量操作按鈕 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={searchQuery || filterMode !== "all" ? handleSelectFiltered : handleSelectAll}
              disabled={isSubmitting || filteredRoles.length === 0}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              {searchQuery || filterMode !== "all" ? "Select Filtered" : "Select All"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={searchQuery || filterMode !== "all" ? handleDeselectFiltered : handleDeselectAll}
              disabled={isSubmitting || (searchQuery || filterMode !== "all" ? filteredRoles.length === 0 : selectedRoleIds.length === 0)}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              {searchQuery || filterMode !== "all" ? "Deselect Filtered" : "Deselect All"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInvertSelection}
              disabled={isSubmitting || availableRoles.length === 0}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              Invert Selection
            </Button>
          </div>

          {/* 角色列表 */}
          <ScrollArea className="h-[350px] rounded-md border border-gray-300 bg-gray-50/30 p-4">
            {availableRoles.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                No available roles
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">No roles found</p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleClearSearch}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-start space-x-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleToggleRole(role.id)}
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-medium leading-none cursor-pointer text-gray-900"
                      >
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-gray-600">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* 已選擇角色數量與統計 */}
          <div className="flex items-center justify-between rounded-lg bg-blue-50/50 px-4 py-3 border border-blue-200/50">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Selected: </span>
                <span className="text-sm font-semibold text-blue-600">
                  {selectedRoleIds.length} / {availableRoles.length}
                </span>
              </div>
              {(searchQuery || filterMode !== "all") && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Showing: </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {filteredRoles.length}
                  </span>
                </div>
              )}
            </div>
            {selectedRoleIds.length > 0 && (
              <Badge className="bg-blue-600 hover:bg-blue-700">
                {selectedRoleIds.length === availableRoles.length
                  ? "All selected"
                  : `${Math.round((selectedRoleIds.length / availableRoles.length) * 100)}%`}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
