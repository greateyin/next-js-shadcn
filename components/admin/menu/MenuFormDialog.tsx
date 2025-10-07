"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { createMenuItem, updateMenuItem } from "@/actions/menu";
import { CreateMenuItemSchema } from "@/schemas/menu";
import * as LucideIcons from "lucide-react";

/**
 * MenuItem interface definition
 */
interface MenuItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  path: string;
  icon: string | null;
  type: string;
  parentId: string | null;
  applicationId: string;
  order: number;
  isVisible: boolean;
  isDisabled: boolean;
}

/**
 * Application interface definition
 */
interface Application {
  id: string;
  name: string;
  displayName: string;
}

/**
 * MenuFormDialog Props
 */
interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem;
  applications: Application[];
  menuItems: MenuItem[];
  onSuccess?: () => void;
}

/**
 * Get list of commonly used Lucide icons
 */
const getCommonIcons = () => {
  return [
    "LayoutDashboard",
    "Users",
    "Settings",
    "FileText",
    "Folder",
    "Home",
    "Menu",
    "Search",
    "Bell",
    "Mail",
    "Calendar",
    "Clock",
    "Heart",
    "Star",
    "Bookmark",
    "Tag",
    "Upload",
    "Download",
    "Share",
    "Link",
    "ExternalLink",
    "Edit",
    "Trash",
    "Plus",
    "Minus",
    "Check",
    "X",
    "ChevronRight",
    "ChevronLeft",
    "ChevronUp",
    "ChevronDown",
    "ArrowRight",
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
    "Grid",
    "List",
    "Layers",
    "Package",
    "ShoppingCart",
    "CreditCard",
    "DollarSign",
    "TrendingUp",
    "BarChart",
    "PieChart",
    "Activity",
    "Zap",
    "Command",
    "Code",
    "Database",
    "Server",
    "Globe",
    "Lock",
    "Unlock",
    "Shield",
    "Eye",
    "EyeOff",
    "UserCircle",
    "UserPlus",
    "UserCheck",
    "UserX",
    "MessageSquare",
    "MessageCircle",
    "Phone",
    "Video",
    "Image",
    "Film",
    "Music",
    "Mic",
    "Camera",
    "Map",
    "MapPin",
    "Navigation",
    "Compass",
    "Award",
    "Gift",
    "Box",
    "Briefcase",
    "Clipboard",
    "Copy",
    "Scissors",
    "Filter",
    "Sliders",
    "Tool",
    "Wrench",
    "HelpCircle",
    "Info",
    "AlertCircle",
    "AlertTriangle",
    "CheckCircle",
    "XCircle",
    "RefreshCw",
    "RotateCw",
    "Maximize",
    "Minimize",
    "ZoomIn",
    "ZoomOut",
    "Power",
    "LogOut",
    "LogIn",
  ];
};

/**
 * MenuFormDialog component
 * Used to create or edit menu items
 */
export function MenuFormDialog({
  open,
  onOpenChange,
  menuItem,
  applications,
  menuItems,
  onSuccess,
}: MenuFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const isEditMode = !!menuItem;

  // Form definition
  const form = useForm<z.infer<typeof CreateMenuItemSchema>>({
    resolver: zodResolver(CreateMenuItemSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      path: "",
      icon: "",
      type: "LINK",
      parentId: "",
      applicationId: "",
      order: 0,
      isVisible: true,
      isDisabled: false,
    },
  });

  // Reset form when dialog opens or menuItem changes
  useEffect(() => {
    if (open) {
      if (menuItem) {
        form.reset({
          name: menuItem.name,
          displayName: menuItem.displayName,
          description: menuItem.description || "",
          path: menuItem.path,
          icon: menuItem.icon || "",
          type: menuItem.type as "LINK" | "GROUP" | "DIVIDER" | "EXTERNAL",
          parentId: menuItem.parentId || "",
          applicationId: menuItem.applicationId,
          order: menuItem.order,
          isVisible: menuItem.isVisible,
          isDisabled: menuItem.isDisabled,
        });
        setSelectedApplication(menuItem.applicationId);
      } else {
        form.reset({
          name: "",
          displayName: "",
          description: "",
          path: "",
          icon: "",
          type: "LINK",
          parentId: "",
          applicationId: "",
          order: 0,
          isVisible: true,
          isDisabled: false,
        });
        setSelectedApplication(null);
      }
    }
  }, [open, menuItem, form]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: z.infer<typeof CreateMenuItemSchema>) => {
    setIsSubmitting(true);

    try {
      // Convert empty strings to null
      const processedData = {
        ...data,
        description: data.description || null,
        icon: data.icon === "none" ? null : data.icon || null,
        parentId: data.parentId === "none" ? null : data.parentId || null,
      };

      let result;
      if (isEditMode && menuItem) {
        result = await updateMenuItem({
          id: menuItem.id,
          ...processedData,
        });
      } else {
        result = await createMenuItem(processedData);
      }

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("[MENU_FORM_SUBMIT]", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get available parent menu items (excluding self and own children)
   */
  const getAvailableParentItems = () => {
    if (!selectedApplication) return [];

    return menuItems.filter((item) => {
      // Must belong to the same application
      if (item.applicationId !== selectedApplication) return false;

      // In edit mode, exclude self
      if (isEditMode && menuItem && item.id === menuItem.id) return false;

      // Exclude divider type
      if (item.type === "DIVIDER") return false;

      return true;
    });
  };

  /**
   * Render icon preview
   */
  const renderIconPreview = (iconName: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="h-5 w-5 text-gray-600" />;
  };

  const commonIcons = getCommonIcons();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto !bg-white border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {isEditMode ? "Edit Menu Item" : "Create Menu Item"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditMode
              ? "Update the menu item information"
              : "Add a new menu item to the application"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Application selection */}
            <FormField
              control={form.control}
              name="applicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Application *</FormLabel>
                  <Select
                    disabled={isEditMode}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedApplication(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., user-management"
                      {...field}
                      className="border-gray-300"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Internal name (lowercase, hyphens, underscores only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Display Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., User Management"
                      {...field}
                      className="border-gray-300"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Name shown in the menu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description or tooltip text"
                      className="resize-none border-gray-300"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Path */}
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Path *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/admin/users"
                      {...field}
                      className="border-gray-300 font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    URL path for this menu item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Icon</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon">
                          {field.value && (
                            <div className="flex items-center gap-2">
                              {renderIconPreview(field.value)}
                              <span>{field.value}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">None</SelectItem>
                      {commonIcons.map((iconName) => {
                        const IconComponent = (LucideIcons as any)[iconName];
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              {IconComponent && <IconComponent className="h-4 w-4" />}
                              <span>{iconName}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-gray-500">
                    Lucide icon name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LINK">Link (Regular menu item)</SelectItem>
                      <SelectItem value="GROUP">Group (Non-clickable header)</SelectItem>
                      <SelectItem value="DIVIDER">Divider (Visual separator)</SelectItem>
                      <SelectItem value="EXTERNAL">External (Opens in new tab)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent menu item */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Parent Item</FormLabel>
                  <Select
                    disabled={!selectedApplication}
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None (Top level)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">None (Top level)</SelectItem>
                      {getAvailableParentItems().map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-gray-500">
                    Optional parent for nested menus
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order */}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="border-gray-300"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Display order (lower numbers appear first)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility */}
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg bg-gray-50 p-4 gap-4">
                  <div className="space-y-0.5 flex-1">
                    <FormLabel className="text-base text-gray-900">Visible</FormLabel>
                    <FormDescription className="text-sm text-gray-600">
                      Show this menu item in navigation
                    </FormDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300"
                      />
                    </FormControl>
                    <span className={`text-sm font-medium whitespace-nowrap ${field.value ? 'text-blue-600' : 'text-gray-500'}`}>
                      {field.value ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Enabled status */}
            <FormField
              control={form.control}
              name="isDisabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg bg-gray-50 p-4 gap-4">
                  <div className="space-y-0.5 flex-1">
                    <FormLabel className="text-base text-gray-900">Enabled Status</FormLabel>
                    <FormDescription className="text-sm text-gray-600">
                      Control whether users can access this menu item
                    </FormDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Switch 
                        checked={!field.value} 
                        onCheckedChange={(checked) => field.onChange(!checked)}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-400"
                      />
                    </FormControl>
                    <span className={`text-sm font-medium whitespace-nowrap ${!field.value ? 'text-green-600' : 'text-red-500'}`}>
                      {!field.value ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </FormItem>
              )}
            />

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
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
