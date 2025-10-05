"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createApplication, updateApplication } from "@/actions/application";

// Common Lucide icons for applications
const COMMON_ICONS = [
  { value: "none", label: "None" },
  { value: "LayoutDashboard", label: "LayoutDashboard" },
  { value: "Users", label: "Users" },
  { value: "UserCog", label: "UserCog" },
  { value: "Settings", label: "Settings" },
  { value: "Shield", label: "Shield" },
  { value: "ShieldCheck", label: "ShieldCheck" },
  { value: "Lock", label: "Lock" },
  { value: "Database", label: "Database" },
  { value: "Server", label: "Server" },
  { value: "FileText", label: "FileText" },
  { value: "FolderOpen", label: "FolderOpen" },
  { value: "Package", label: "Package" },
  { value: "Boxes", label: "Boxes" },
  { value: "Layers", label: "Layers" },
  { value: "Grid", label: "Grid" },
  { value: "List", label: "List" },
  { value: "Activity", label: "Activity" },
  { value: "BarChart", label: "BarChart" },
  { value: "PieChart", label: "PieChart" },
  { value: "TrendingUp", label: "TrendingUp" },
  { value: "MessageSquare", label: "MessageSquare" },
  { value: "Mail", label: "Mail" },
  { value: "Bell", label: "Bell" },
  { value: "Calendar", label: "Calendar" },
  { value: "Clock", label: "Clock" },
  { value: "Globe", label: "Globe" },
  { value: "Home", label: "Home" },
  { value: "Briefcase", label: "Briefcase" },
  { value: "ShoppingCart", label: "ShoppingCart" },
  { value: "CreditCard", label: "CreditCard" },
  { value: "Wallet", label: "Wallet" },
  { value: "Tag", label: "Tag" },
  { value: "Star", label: "Star" },
  { value: "Heart", label: "Heart" },
  { value: "Zap", label: "Zap" },
];

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    path: string;
    icon: string | null;
    order: number;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

/**
 * ApplicationFormDialog - Apple Style (Consistent with RolesTable)
 * 應用程式表單對話框
 */
export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    path: "",
    icon: "",
    order: 0,
    isActive: true,
  });

  const isEditMode = !!application;

  useEffect(() => {
    if (application) {
      setFormData({
        name: application.name || "",
        displayName: application.displayName || "",
        description: application.description || "",
        path: application.path || "",
        icon: application.icon || "none",
        order: application.order || 0,
        isActive: application.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        displayName: "",
        description: "",
        path: "",
        icon: "none",
        order: 0,
        isActive: true,
      });
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;

      // Convert "none" to empty string for icon
      const submitData = {
        ...formData,
        icon: formData.icon === "none" ? "" : formData.icon,
      };

      if (isEditMode) {
        result = await updateApplication({
          id: application!.id,
          ...submitData,
        });
      } else {
        result = await createApplication(submitData);
      }

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("[APPLICATION_FORM]", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-gray-200/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {isEditMode ? "Edit Application" : "Add New Application"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {isEditMode
                ? "Update application information"
                : "Create a new application for the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-700">
                Application Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                placeholder="e.g., user-management"
                required
              />
              <p className="text-xs text-gray-500">
                Internal unique identifier (letters, numbers, hyphens, underscores only)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayName" className="text-gray-700">
                Display Name *
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                placeholder="e.g., User Management"
                required
              />
              <p className="text-xs text-gray-500">
                Name displayed in the user interface
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="path" className="text-gray-700">
                Application Path *
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">/</span>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="border-gray-300 focus:border-blue-500"
                  placeholder="e.g., admin/users"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">URL path for the application</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-blue-500 min-h-[100px]"
                placeholder="Brief description of the application..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon" className="text-gray-700">
                Icon
              </Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select an icon..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {COMMON_ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Optional: Lucide icon name for the application
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order" className="text-gray-700">
                Sort Order
              </Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="border-gray-300 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Lower numbers appear first</p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 gap-4">
              <div className="flex-1">
                <Label htmlFor="isActive" className="text-gray-700 font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Control whether the application is visible to users
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                />
                <span className={`text-sm font-medium whitespace-nowrap ${formData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
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
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Save Changes" : "Create Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
