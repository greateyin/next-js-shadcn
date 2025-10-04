"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Menu } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

interface DashboardNavProps {
  onMenuToggle?: () => void;
}

export function DashboardNav({ onMenuToggle }: DashboardNavProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden mr-2 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>

        <div className="flex-1">
          <div className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="w-full pl-9 border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-700" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
                <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                  <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 rounded-2xl border-gray-200/50 shadow-2xl bg-white/95 backdrop-blur-xl p-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal px-3 py-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-gray-900 leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-gray-500 mt-1">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2.5">
                <a href="/dashboard/profile" className="text-gray-700 hover:text-gray-900 font-medium">Profile</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2.5">
                <a href="/settings" className="text-gray-700 hover:text-gray-900 font-medium">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50 px-3 py-2.5">
                <LogoutButton className="text-red-600 hover:text-red-700 font-medium w-full text-left">Log out</LogoutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
