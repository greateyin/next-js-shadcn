"use client";

import { useEffect, useState } from "react";
import { ApplicationsTable } from "@/components/admin/applications/ApplicationsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplications } from "@/actions/application";

interface Application {
  id: string;
  name: string;
  displayName: string;
  description: string;
  path: string;
  icon: string | null;
  isActive: boolean;
  roles: Array<{
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  menuItemCount: number;
  order: number;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 獲取應用程式列表
      const appsResult = await getApplications();
      
      // 獲取所有角色
      const rolesData = await fetch("/api/roles").then((res) => res.json());
      
      if (appsResult.applications) {
        const formattedApplications = appsResult.applications.map((app: any) => ({
          id: app.id,
          name: app.name,
          displayName: app.displayName,
          description: app.description || "無描述",
          path: app.path,
          icon: app.icon,
          isActive: app.isActive,
          roles: app.roles || [],
          menuItemCount: app._count?.menuItems || 0,
          order: app.order,
          createdAt: app.createdAt.toString(),
        }));
        
        setApplications(formattedApplications);
      }
      
      if (rolesData.roles) {
        setAvailableRoles(rolesData.roles);
      }
    } catch (error) {
      console.error("[LOAD_APPLICATIONS]", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
            Application Management
          </h2>
          <p className="text-gray-600 mt-2">Manage system applications and access control</p>
        </div>
      </div>

      <Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Applications</CardTitle>
          <CardDescription className="text-gray-600">
            Configure applications and role access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <ApplicationsTable
              applications={applications}
              availableRoles={availableRoles}
              onRefresh={loadData}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}