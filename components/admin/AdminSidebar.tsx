'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Application } from "@/types/roles";
import { cn } from "@/lib/utils";
import { 
  UsersIcon, 
  LayoutDashboardIcon, 
  ShieldIcon, 
  LayoutGrid, 
  MenuIcon,
  SettingsIcon,
  HelpCircleIcon,
  X
} from "lucide-react";
import { useState } from "react";

interface AdminSidebarProps {
  applications: Application[];
  isOpen?: boolean;
  onClose?: () => void;
}

interface SidebarItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ href, title, icon, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
          : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
      )}
    >
      {icon}
      {title}
    </Link>
  );
}

function useActiveLink() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ applications, isOpen = false, onClose }: AdminSidebarProps) {
  const isActive = useActiveLink();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Apple Style */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0",
          "bg-white/80 backdrop-blur-xl border-r border-gray-200/50",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200/50 px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-gray-900">
            <ShieldIcon className="h-5 w-5" />
            <span className="text-lg font-medium">Admin Panel</span>
          </Link>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          <nav className="flex flex-col gap-0.5">
          <div className="py-2">
            <h3 className="mb-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Dashboard
            </h3>
            <SidebarItem
              href="/admin"
              title="Overview"
              icon={<LayoutDashboardIcon className="h-4 w-4" />}
              active={isActive("/admin")}
            />
          </div>
          <div className="py-2">
            <h3 className="mb-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Access Control
            </h3>
            <SidebarItem
              href="/admin/users"
              title="Users"
              icon={<UsersIcon className="h-4 w-4" />}
              active={isActive("/admin/users")}
            />
            <SidebarItem
              href="/admin/roles"
              title="Roles"
              icon={<ShieldIcon className="h-4 w-4" />}
              active={isActive("/admin/roles")}
            />
            <SidebarItem
              href="/admin/applications"
              title="Applications"
              icon={<LayoutGrid className="h-4 w-4" />}
              active={isActive("/admin/applications")}
            />
            <SidebarItem
              href="/admin/menu"
              title="Menu"
              icon={<MenuIcon className="h-4 w-4" />}
              active={isActive("/admin/menu")}
            />
          </div>
          {applications.length > 0 && (
            <div className="py-2">
              <h3 className="mb-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Applications
              </h3>
              {applications
                .filter(app => app.isActive)
                .map(app => (
                  <SidebarItem
                    key={app.id}
                    href={`/${app.path}`}
                    title={app.displayName}
                    icon={<LayoutGrid className="h-4 w-4" />}
                  />
                ))}
            </div>
          )}
          <div className="py-2">
            <h3 className="mb-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </h3>
            <SidebarItem
              href="/admin/settings"
              title="Settings"
              icon={<SettingsIcon className="h-4 w-4" />}
              active={isActive("/admin/settings")}
            />
            <SidebarItem
              href="/admin/help"
              title="Help & Support"
              icon={<HelpCircleIcon className="h-4 w-4" />}
              active={isActive("/admin/help")}
            />
          </div>
        </nav>
        
        {/* Footer with Dashboard Link */}
        <div className="border-t border-gray-200/50 p-4 mt-auto space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 p-3.5 shadow-sm hover:shadow-md transition-all group"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                Back to Dashboard
              </p>
            </div>
            <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
    </>
  );
}