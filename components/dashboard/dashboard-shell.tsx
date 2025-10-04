/**
 * @fileoverview Dashboard Shell Component
 * @module components/dashboard/dashboard-shell
 * @description Main layout wrapper for dashboard pages with dynamic menu
 */

import { ReactNode } from "react";
import { DashboardNav } from "./dashboard-nav";
import { DashboardSidebar, type SidebarMenuItem } from "./dashboard-sidebar";

interface DashboardShellProps {
  children: ReactNode;
  menuItems?: SidebarMenuItem[];
}

/**
 * Dashboard Shell Component
 * @component
 * @description Provides the main layout structure for dashboard pages
 * 
 * @param {ReactNode} children - Page content
 * @param {SidebarMenuItem[]} menuItems - Dynamic menu items (optional)
 */
export function DashboardShell({ children, menuItems = [] }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar items={menuItems} />
      <div className="flex-1 flex flex-col">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
