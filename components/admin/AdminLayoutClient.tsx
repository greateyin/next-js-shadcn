/**
 * @fileoverview Admin Layout Client Component - Apple Style with RWD
 * @module components/admin/AdminLayoutClient
 * @description Client-side layout wrapper for admin pages with mobile menu support
 */

"use client";

import { useState } from "react";
import { User } from "next-auth";
import { Application } from "@/types/roles";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: User;
  applications: Application[];
}

/**
 * Admin Layout Client Component - Apple Style with RWD
 * @component
 * @description Provides the main layout structure for admin pages
 * Features:
 * - Responsive sidebar (mobile drawer, desktop fixed)
 * - Apple-inspired design (clean, minimal, blur effects)
 * - Mobile-friendly navigation
 * 
 * @param {React.ReactNode} children - Page content
 * @param {User} user - Current user object
 * @param {Application[]} applications - User's accessible applications
 */
export function AdminLayoutClient({ children, user, applications }: AdminLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sidebar - Mobile: Drawer, Desktop: Fixed */}
      <AdminSidebar 
        applications={applications}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <AdminHeader 
          user={user} 
          onMenuToggle={() => setIsMobileMenuOpen(true)}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
