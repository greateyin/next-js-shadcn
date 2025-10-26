'use client'

import { User } from "next-auth";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface AdminHeaderProps {
  user: User;
  onMenuToggle?: () => void;
}

export function AdminHeader({ user, onMenuToggle }: AdminHeaderProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : user.email?.[0] || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="md:hidden hover:bg-gray-100"
        aria-label="Toggle Menu"
      >
        <MenuIcon className="h-5 w-5 text-gray-700" />
      </Button>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <ModeToggle />
          <NotificationDropdown />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover:bg-gray-100"
                aria-label="User Account"
              >
                <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 rounded-2xl border-gray-200/50 shadow-2xl bg-white/95 backdrop-blur-xl p-2" align="end">
              <DropdownMenuLabel className="font-normal px-3 py-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-gray-500 mt-1">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200/50 my-2" />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2.5">
                <Link href="/dashboard/profile" className="text-gray-700 hover:text-gray-900 font-medium">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2.5">
                <Link href="/settings" className="text-gray-700 hover:text-gray-900 font-medium">Settings</Link>
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