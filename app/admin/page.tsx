"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { Overview, type OverviewDatum } from "@/components/admin/dashboard/Overview";
import { Users, AppWindow, Activity, Shield, Menu, Database, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLogEntry {
  id: string;
  action: string;
  status?: string | null;
  timestamp: string;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

interface StatsData {
  users: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    withTwoFactor: number;
    growthPercentage: string;
    byStatus: Record<string, number>;
  };
  roles: {
    total: number;
  };
  applications: {
    total: number;
    active: number;
    inactive: number;
  };
  menuItems: {
    total: number;
    visible: number;
    disabled: number;
  };
  sessions: {
    active: number;
    today: number;
    growthPercentage: string;
  };
  permissions: {
    total: number;
  };
  auditLogs: {
    recent: AuditLogEntry[];
    failed24h: number;
    critical24h: number;
  };
  systemHealth: {
    status: string;
    percentage: number;
    message: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const overviewData = useMemo<OverviewDatum[]>(() => {
    if (!stats) {
      return [];
    }

    const inactiveUsers = Math.max(stats.users.total - stats.users.active, 0);

    return [
      {
        name: "Total",
        users: stats.users.total,
        applications: stats.applications.total,
      },
      {
        name: "Active",
        users: stats.users.active,
        applications: stats.applications.active,
      },
      {
        name: "Inactive",
        users: inactiveUsers,
        applications: stats.applications.inactive,
      },
    ];
  }, [stats]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("[FETCH_STATS]", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-2">Monitor and manage your system</p>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-100/80 border border-gray-200/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
            Recent Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {/* Primary Stats */}
          <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Users</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.users.total || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.users.active || 0} active · {stats?.users.pending || 0} pending
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Applications */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Applications</CardTitle>
                <AppWindow className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.applications.total || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.applications.active || 0} active · {stats?.applications.inactive || 0} inactive
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.sessions.active || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.sessions.today || 0} today
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">System Health</CardTitle>
                <Shield className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.systemHealth.percentage || 100}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.systemHealth.message || "All systems operational"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Roles */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Roles</CardTitle>
                <Shield className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.roles.total || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Total roles configured</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Menu Items */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Menu Items</CardTitle>
                <Menu className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.menuItems.total || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.menuItems.visible || 0} visible
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Permissions</CardTitle>
                <Database className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.permissions.total || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Access control rules</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Failed Operations (24h) */}
            <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Failed Operations</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats?.auditLogs.failed24h || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Last 24 hours</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={overviewData} isLoading={loading} />
              </CardContent>
            </Card>
            <Card className="col-span-3 border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="text-gray-600">
                  Recent system activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity auditLogs={stats?.auditLogs.recent} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="activity" className="space-y-6">
          <Card className="col-span-3 border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Activity Log</CardTitle>
              <CardDescription className="text-gray-600">
                System-wide activity log
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity auditLogs={stats?.auditLogs.recent} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}