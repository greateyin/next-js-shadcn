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
  HelpCircleIcon
} from "lucide-react";

interface AdminSidebarProps {
  applications: Application[];
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

export function AdminSidebar({ applications }: AdminSidebarProps) {
  const isActive = useActiveLink();

  return (
    <aside className="hidden w-64 border-r bg-background md:block">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <ShieldIcon className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <div className="p-4">
        <nav className="flex flex-col gap-1">
          <div className="py-2">
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
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
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
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
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
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
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
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
      </div>
    </aside>
  );
}