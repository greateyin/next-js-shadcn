"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icon-map";
import { LayoutDashboard, X } from "lucide-react";
import { useState } from "react";

/**
 * Menu item type
 */
export type MenuItemType = "LINK" | "GROUP" | "DIVIDER" | "EXTERNAL";

/**
 * Menu item interface for sidebar
 */
export interface SidebarMenuItem {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  path: string;
  icon?: string | null;
  type: MenuItemType;
  order: number;
  children?: SidebarMenuItem[];
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarMenuItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ className, items, isOpen = false, onClose, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  /**
   * Render menu item (supports LINK, GROUP, DIVIDER types)
   */
  const renderMenuItem = (item: SidebarMenuItem) => {
    const isActive = pathname === item.path;
    const Icon = getIcon(item.icon);

    // Divider - Apple Style
    if (item.type === "DIVIDER") {
      return (
        <div key={item.id} className="my-3 border-t border-gray-200/50" />
      );
    }

    // Group header - Apple Style
    if (item.type === "GROUP") {
      return (
        <div key={item.id} className="px-3 pt-5 pb-2">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {item.displayName}
          </h3>
        </div>
      );
    }

    // External link - Apple Style
    if (item.type === "EXTERNAL") {
      return (
        <a
          key={item.id}
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
            "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
          )}
          title={item.description || undefined}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{item.displayName}</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      );
    }

    // Regular link - Apple Style
    return (
      <Link
        key={item.id}
        href={item.path}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
            : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
        )}
        title={item.description || undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.displayName}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Apple Style */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          "bg-white/80 backdrop-blur-xl border-r border-gray-200/50",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand Area - Apple Style */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200/50 px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-lg font-medium">Dashboard</span>
            </Link>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation - Apple Style */}
          <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} onClick={onClose}>
                {renderMenuItem(item)}
                {/* Render children if exists */}
                {item.children && item.children.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <div key={child.id} onClick={onClose}>
                        {renderMenuItem(child)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Area - Apple Style */}
          <div className="border-t border-gray-200/50 p-4 space-y-3">
            {/* Admin Panel Link (if user has access) */}
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 shadow-sm hover:shadow-md transition-all group"
            >
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Admin Panel
                </p>
                <p className="text-[10px] text-gray-500">
                  Manage system settings
                </p>
              </div>
              <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-3.5 shadow-sm">
              <p className="text-xs text-gray-600">
                Need help?{" "}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
