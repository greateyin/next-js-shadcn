"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icon-map";
import { LayoutDashboard } from "lucide-react";

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
}

export function DashboardSidebar({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  /**
   * Render menu item (supports LINK, GROUP, DIVIDER types)
   */
  const renderMenuItem = (item: SidebarMenuItem) => {
    const isActive = pathname === item.path;
    const Icon = getIcon(item.icon);

    // Divider
    if (item.type === "DIVIDER") {
      return (
        <div key={item.id} className="my-2 border-t border-border" />
      );
    }

    // Group header (non-clickable)
    if (item.type === "GROUP") {
      return (
        <div key={item.id} className="px-3 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {item.displayName}
          </h3>
        </div>
      );
    }

    // External link
    if (item.type === "EXTERNAL") {
      return (
        <a
          key={item.id}
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
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

    // Regular link
    return (
      <Link
        key={item.id}
        href={item.path}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title={item.description || undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.displayName}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden lg:block w-64 border-r bg-muted/10">
      <div className="flex h-full flex-col gap-2">
        {/* Logo/Brand Area */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-lg">Dashboard</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id}>
              {renderMenuItem(item)}
              {/* Render children if exists (simple one-level nesting) */}
              {item.children && item.children.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => renderMenuItem(child))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              Need help? <a href="#" className="font-medium text-foreground hover:underline">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
