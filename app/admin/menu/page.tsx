"use client";

import { useEffect, useState } from "react";
import { MenuTable } from "@/components/admin/menu/MenuTable";
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
  AdminLoadingState,
} from "@/components/admin/common";
import { getMenuItems } from "@/actions/menu";

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
 * Application interface definition
 */
interface Application {
  id: string;
  name: string;
  displayName: string;
}

/**
 * Role interface definition
 */
interface Role {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Menu management page component
 */
export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load data
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get menu item list
      const menuResult = await getMenuItems();

      // Get all applications
      const appsData = await fetch("/api/applications").then((res) => res.json());

      // Get all roles
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
    <AdminPageContainer>
      <AdminPageHeader
        title="Menu Management"
        description="Manage application menus and navigation structure"
      />

      <AdminCard
        title="Menu Items"
        description="Configure menu items, hierarchy, and role access"
        noPadding
      >
        {isLoading ? (
          <AdminLoadingState message="Loading menu items..." />
        ) : (
          <MenuTable
            menuItems={menuItems}
            applications={applications}
            availableRoles={availableRoles}
            onRefresh={loadData}
          />
        )}
      </AdminCard>
    </AdminPageContainer>
  );
}
