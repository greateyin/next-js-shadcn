"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MenuFormDialog } from "./MenuFormDialog";
import { ManageMenuRolesDialog } from "./ManageMenuRolesDialog";
import { deleteMenuItem, toggleMenuVisibility, toggleMenuDisabled } from "@/actions/menu";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Search,
  Eye,
  EyeOff,
  Ban,
  Link,
  Layers,
  ExternalLink,
  Minus,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

/**
 * MenuItem 介面定義
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
  createdAt: string;
  application: {
    id: string;
    name: string;
    displayName: string;
  };
  parent: {
    id: string;
    name: string;
    displayName: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  roleAccess: Array<{
    role: {
      id: string;
      name: string;
      description: string | null;
    };
    canView: boolean;
    canAccess: boolean;
  }>;
  _count: {
    children: number;
  };
}

/**
 * Application 介面定義
 */
interface Application {
  id: string;
  name: string;
  displayName: string;
}

/**
 * Role 介面定義
 */
interface Role {
  id: string;
  name: string;
  description: string | null;
}

/**
 * MenuTable Props
 */
interface MenuTableProps {
  menuItems: MenuItem[];
  applications: Application[];
  availableRoles: Role[];
  onRefresh: () => void;
}

/**
 * 獲取選單項目類型圖標
 */
const getTypeIcon = (type: string) => {
  switch (type) {
    case "LINK":
      return <Link className="h-4 w-4" />;
    case "GROUP":
      return <Layers className="h-4 w-4" />;
    case "DIVIDER":
      return <Minus className="h-4 w-4" />;
    case "EXTERNAL":
      return <ExternalLink className="h-4 w-4" />;
    default:
      return <Link className="h-4 w-4" />;
  }
};

/**
 * 獲取選單項目類型樣式
 */
const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (type) {
    case "LINK":
      return "default";
    case "GROUP":
      return "secondary";
    case "DIVIDER":
      return "outline";
    case "EXTERNAL":
      return "default";
    default:
      return "default";
  }
};

/**
 * MenuTable 組件
 * 顯示和管理選單項目列表
 */
export function MenuTable({ menuItems, applications, availableRoles, onRefresh }: MenuTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * 篩選選單項目
   */
  const filteredMenuItems = menuItems.filter((item) => {
    // 搜尋篩選
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // 應用程式篩選
    const matchesApplication =
      selectedApplication === "all" || item.applicationId === selectedApplication;

    // 類型篩選
    const matchesType = selectedType === "all" || item.type === selectedType;

    return matchesSearch && matchesApplication && matchesType;
  });

  /**
   * 處理編輯
   */
  const handleEdit = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsEditDialogOpen(true);
  };

  /**
   * 處理管理角色存取
   */
  const handleManageRoles = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsRolesDialogOpen(true);
  };

  /**
   * 處理刪除
   */
  const handleDelete = async (menuItem: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${menuItem.displayName}"?`)) {
      return;
    }

    setIsDeleting(menuItem.id);

    try {
      const result = await deleteMenuItem({ id: menuItem.id });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        onRefresh();
      }
    } catch (error) {
      console.error("[DELETE_MENU_ITEM]", error);
      toast.error("Failed to delete menu item");
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * 渲染選單項目圖標
   */
  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;

    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;

    return <IconComponent className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100">
        <div className="flex items-center gap-4 flex-1">
          {/* 搜尋框 */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 應用程式篩選 */}
          <Select value={selectedApplication} onValueChange={setSelectedApplication}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Applications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {applications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 類型篩選 */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LINK">Link</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="DIVIDER">Divider</SelectItem>
              <SelectItem value="EXTERNAL">External</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 新增按鈕 */}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* 表格 */}
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Path</TableHead>
              <TableHead className="font-semibold text-gray-700">Application</TableHead>
              <TableHead className="font-semibold text-gray-700">Type</TableHead>
              <TableHead className="font-semibold text-gray-700">Parent</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Order</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Roles</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMenuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                  No menu items found
                </TableCell>
              </TableRow>
            ) : (
              filteredMenuItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50">
                  {/* 名稱 */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {renderIcon(item.icon)}
                      <div>
                        <div className="font-medium text-gray-900">{item.displayName}</div>
                        <div className="text-sm text-gray-500">{item.name}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* 路徑 */}
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {item.path}
                    </code>
                  </TableCell>

                  {/* 應用程式 */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.application.displayName}
                    </Badge>
                  </TableCell>

                  {/* 類型 */}
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(item.type)} className="gap-1">
                      {getTypeIcon(item.type)}
                      {item.type}
                    </Badge>
                  </TableCell>

                  {/* 父項目 */}
                  <TableCell>
                    {item.parent ? (
                      <span className="text-sm text-gray-600">{item.parent.displayName}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>

                  {/* 順序 */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {item.order}
                    </Badge>
                  </TableCell>

                  {/* 狀態 */}
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {/* Visibility Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isVisible}
                          onCheckedChange={async (checked) => {
                            const result = await toggleMenuVisibility({
                              id: item.id,
                              isVisible: checked,
                            });
                            if (result.error) {
                              toast.error(result.error);
                            } else if (result.success) {
                              toast.success(result.success);
                              onRefresh();
                            }
                          }}
                          className={cn(
                            "data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300",
                            "scale-75"
                          )}
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          item.isVisible ? "text-blue-600" : "text-gray-500"
                        )}>
                          {item.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      
                      {/* Disabled Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!item.isDisabled}
                          onCheckedChange={async (checked) => {
                            const result = await toggleMenuDisabled({
                              id: item.id,
                              isDisabled: !checked,
                            });
                            if (result.error) {
                              toast.error(result.error);
                            } else if (result.success) {
                              toast.success(result.success);
                              onRefresh();
                            }
                          }}
                          className={cn(
                            "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-400",
                            "scale-75"
                          )}
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          !item.isDisabled ? "text-green-600" : "text-red-500"
                        )}>
                          {!item.isDisabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* 角色 */}
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {item.roleAccess.length} role{item.roleAccess.length !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>

                  {/* 操作 */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageRoles(item)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Manage Roles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting === item.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting === item.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 對話框 */}
      <MenuFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        applications={applications}
        menuItems={menuItems}
        onSuccess={onRefresh}
      />

      {selectedMenuItem && (
        <>
          <MenuFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            menuItem={selectedMenuItem}
            applications={applications}
            menuItems={menuItems}
            onSuccess={onRefresh}
          />

          <ManageMenuRolesDialog
            open={isRolesDialogOpen}
            onOpenChange={setIsRolesDialogOpen}
            menuItemId={selectedMenuItem.id}
            menuItemName={selectedMenuItem.displayName}
            currentRoleIds={selectedMenuItem.roleAccess.map((ra) => ra.role.id)}
            availableRoles={availableRoles}
            onSuccess={onRefresh}
          />
        </>
      )}
    </div>
  );
}
