import { ReactNode } from "react";
import { DashboardNav } from "./dashboard-nav";
import { DashboardSidebar, defaultItems } from "./dashboard-sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar items={defaultItems} />
      <div className="flex-1 flex flex-col">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
