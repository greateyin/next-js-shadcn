"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Zap, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  users: { total: number; growth: string; description: string };
  roles: { total: number; growth: string; description: string };
  applications: { total: number; growth: string; description: string };
  sessions: { total: number; growth: string; description: string };
  permissions: { total: number; growth: string; description: string };
  recentActivities: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    changes: any;
  }>;
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load dashboard statistics: {error}
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: stats.users.description,
      value: stats.users.total,
      growth: stats.users.growth,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: stats.roles.description,
      value: stats.roles.total,
      growth: stats.roles.growth,
      icon: Shield,
      color: "text-purple-600",
    },
    {
      title: stats.applications.description,
      value: stats.applications.total,
      growth: stats.applications.growth,
      icon: Zap,
      color: "text-amber-600",
    },
    {
      title: stats.sessions.description,
      value: stats.sessions.total,
      growth: stats.sessions.growth,
      icon: Lock,
      color: "text-green-600",
    },
    {
      title: stats.permissions.description,
      value: stats.permissions.total,
      growth: stats.permissions.growth,
      icon: Shield,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-gray-200/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {item.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {item.value}
                </div>
                <p className="text-xs text-green-600 font-medium">
                  {item.growth}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <Card className="border-gray-200/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action} {activity.entity}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {activity.entity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent activities</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
