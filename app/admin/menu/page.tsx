"use client";

import { useEffect, useState } from "react";
import { MenuTable } from "@/components/admin/menu/MenuTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMenuItems } from "@/actions/menu";

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
 * Menu 管理頁面組件
 */
export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 載入資料
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 獲取選單項目列表
      const menuResult = await getMenuItems();

      // 獲取所有應用程式
      const appsData = await fetch("/api/applications").then((res) => res.json());

      // 獲取所有角色
      const rolesData = await fetch("/api/roles").then((res) => res.json());

      if (menuResult.menuItems) {
        const formattedMenuItems = menuResult.menuItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          displayName: item.displayName,
          description: item.description,
          path: item.path,
          icon: item.icon,
          type: item.type,
          parentId: item.parentId,
          applicationId: item.applicationId,
          order: item.order,
          isVisible: item.isVisible,
          isDisabled: item.isDisabled,
          createdAt: item.createdAt.toString(),
          application: item.application,
          parent: item.parent,
          children: item.children || [],
          roleAccess: item.roleAccess || [],
          _count: item._count || { children: 0 },
        }));

        setMenuItems(formattedMenuItems);
      }

      if (appsData.applications) {
        setApplications(appsData.applications);
      }

      if (rolesData.roles) {
        setAvailableRoles(rolesData.roles);
      }
    } catch (error) {
      console.error("[LOAD_MENU_ITEMS]", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
            Menu Management
          </h2>
          <p className="text-gray-600 mt-2">Manage application menus and navigation structure</p>
        </div>
      </div>

      <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Menu Items</CardTitle>
          <CardDescription className="text-gray-600">
            Configure menu items, hierarchy, and role access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <MenuTable
              menuItems={menuItems}
              applications={applications}
              availableRoles={availableRoles}
              onRefresh={loadData}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
