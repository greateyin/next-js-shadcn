/**
 * @fileoverview Dashboard Shell Component - Apple Style with RWD
 * @module components/dashboard/dashboard-shell
 * @description Main layout wrapper for dashboard pages with dynamic menu and mobile support
 */

"use client";

import { ReactNode, useState } from "react";
import { DashboardNav } from "./dashboard-nav";
import { DashboardSidebar, type SidebarMenuItem } from "./dashboard-sidebar";

interface DashboardShellProps {
  children: ReactNode;
  menuItems?: SidebarMenuItem[];
}

/**
 * Dashboard Shell Component - Apple Style with RWD
 * @component
 * @description Provides the main layout structure for dashboard pages
 * Features:
 * - Responsive sidebar (mobile drawer, desktop fixed)
 * - Apple-inspired design (clean, minimal, blur effects)
 * - Mobile-friendly navigation
 * 
 * @param {ReactNode} children - Page content
 * @param {SidebarMenuItem[]} menuItems - Dynamic menu items (optional)
 */
export function DashboardShell({ children, menuItems = [] }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sidebar - Mobile: Drawer, Desktop: Fixed */}
      <DashboardSidebar 
        items={menuItems} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <DashboardNav onMenuToggle={() => setIsMobileMenuOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
