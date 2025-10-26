"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Bell, Search, Menu, Loader2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

interface SearchResult {
  type: 'menu' | 'role' | 'application';
  id: string;
  title: string;
  description?: string;
  path: string;
  icon?: string;
  app?: string;
}

interface DashboardNavProps {
  onMenuToggle?: () => void;
}

export function DashboardNav({ onMenuToggle }: DashboardNavProps) {
  const { data: session, status, update } = useSession();
  const user = session?.user;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Force session update to ensure latest data
  useEffect(() => {
    if (status === 'authenticated') {
      update();
    }
  }, [user, status, update]);

  // Search functionality
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`
          );
          const data = await response.json();
          setSearchResults(data.results || []);
          setShowSearchResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?limit=1");
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error("Notification fetch error:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

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
              placeholder="Search menu, roles, apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((result) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.path}
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchResults(false);
                        }}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {result.title}
                            </p>
                            {result.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                            {result.type}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="cursor-pointer">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
                <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                  <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                  <AvatarFallback>
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : user?.email?.charAt(0)?.toUpperCase() || "U"}
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
