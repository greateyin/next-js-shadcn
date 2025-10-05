"use client";

import { useEffect, useState } from "react";
import { ApplicationsTable } from "@/components/admin/applications/ApplicationsTable";
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
  AdminLoadingState,
} from "@/components/admin/common";
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

/**
 * Applications Management Page
 * Manages system applications and their role-based access control
 */
export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appsResult, rolesData] = await Promise.all([
        getApplications(),
        fetch("/api/roles").then((res) => res.json()),
      ]);

      if (appsResult.applications) {
        const formattedApplications = appsResult.applications.map((app: any) => ({
          ...app,
          description: app.description || "No description",
          roles: app.roles || [],
          menuItemCount: app._count?.menuItems || 0,
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
    <AdminPageContainer>
      <AdminPageHeader
        title="Application Management"
        description="Manage system applications and access control"
      />

      <AdminCard
        title="Applications"
        description="Configure applications and role access"
        noPadding
      >
        {isLoading ? (
          <AdminLoadingState message="Loading applications..." />
        ) : (
          <ApplicationsTable
            applications={applications}
            availableRoles={availableRoles}
            onRefresh={loadData}
          />
        )}
      </AdminCard>
    </AdminPageContainer>
  );
}