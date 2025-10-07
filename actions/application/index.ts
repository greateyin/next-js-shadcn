"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  createApplicationSchema,
  updateApplicationSchema,
  toggleApplicationStatusSchema,
  deleteApplicationSchema,
  manageApplicationRolesSchema,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  type ToggleApplicationStatusInput,
  type DeleteApplicationInput,
  type ManageApplicationRolesInput,
} from "@/schemas/application";
import { auditLogger } from "@/lib/audit/auditLogger";

/**
 * Create a new application
 */
export async function createApplication(data: CreateApplicationInput) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = createApplicationSchema.parse(data);

    // Check if name already exists
    const existingByName = await db.application.findUnique({
      where: { name: validatedData.name },
    });

    if (existingByName) {
      return { error: "Application name already exists" };
    }

    // Check if path already exists
    const existingByPath = await db.application.findUnique({
      where: { path: validatedData.path },
    });

    if (existingByPath) {
      return { error: "Application path already exists" };
    }

    // Create application
    const application = await db.application.create({
      data: validatedData,
    });

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: "CREATE_APPLICATION",
      status: "SUCCESS",
      resourceType: "Application",
      resourceId: application.id,
      newValue: JSON.stringify(application),
    });

    return { success: "Application created successfully", application };
  } catch (error) {
    console.error("[CREATE_APPLICATION]", error);
    return { error: "Error creating application" };
  }
}

/**
 * Update an application
 */
export async function updateApplication(data: UpdateApplicationInput) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = updateApplicationSchema.parse(data);
    const { id, ...updateData } = validatedData;

    // Check if application exists
    const existingApp = await db.application.findUnique({
      where: { id },
    });

    if (!existingApp) {
      return { error: "Application not found" };
    }

    // If updating name, check if new name is already used by another application
    if (updateData.name && updateData.name !== existingApp.name) {
      const nameExists = await db.application.findFirst({
        where: {
          name: updateData.name,
          id: { not: id },
        },
      });

      if (nameExists) {
        return { error: "Application name already exists" };
      }
    }

    // If updating path, check if new path is already used by another application
    if (updateData.path && updateData.path !== existingApp.path) {
      const pathExists = await db.application.findFirst({
        where: {
          path: updateData.path,
          id: { not: id },
        },
      });

      if (pathExists) {
        return { error: "Application path already exists" };
      }
    }

    // Update application
    const application = await db.application.update({
      where: { id },
      data: updateData,
    });

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: "UPDATE_APPLICATION",
      status: "SUCCESS",
      resourceType: "Application",
      resourceId: application.id,
      oldValue: JSON.stringify(existingApp),
      newValue: JSON.stringify(application),
    });

    return { success: "Application updated successfully", application };
  } catch (error) {
    console.error("[UPDATE_APPLICATION]", error);
    return { error: "Error updating application" };
  }
}

/**
 * Toggle application active status
 */
export async function toggleApplicationStatus(data: ToggleApplicationStatusInput) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = toggleApplicationStatusSchema.parse(data);

    // Check if application exists
    const existingApp = await db.application.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingApp) {
      return { error: "Application not found" };
    }

    // Update status
    const application = await db.application.update({
      where: { id: validatedData.id },
      data: { isActive: validatedData.isActive },
    });

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: validatedData.isActive ? "ENABLE_APPLICATION" : "DISABLE_APPLICATION",
      status: "SUCCESS",
      resourceType: "Application",
      resourceId: application.id,
      oldValue: JSON.stringify({ isActive: existingApp.isActive }),
      newValue: JSON.stringify({ isActive: application.isActive }),
    });

    return {
      success: `Application ${validatedData.isActive ? 'enabled' : 'disabled'} successfully`,
      application,
    };
  } catch (error) {
    console.error("[TOGGLE_APPLICATION_STATUS]", error);
    return { error: "Error toggling application status" };
  }
}

/**
 * Delete an application
 */
export async function deleteApplication(data: DeleteApplicationInput) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = deleteApplicationSchema.parse(data);

    // Check if application exists
    const existingApp = await db.application.findUnique({
      where: { id: validatedData.id },
      include: {
        _count: {
          select: {
            menuItems: true,
            roles: true,
          },
        },
      },
    });

    if (!existingApp) {
      return { error: "Application not found" };
    }

    // Check if there are associated menu items or roles
    if (existingApp._count.menuItems > 0) {
      return {
        error: `Cannot delete application because it has ${existingApp._count.menuItems} associated menu items`,
      };
    }

    if (existingApp._count.roles > 0) {
      return {
        error: `Cannot delete application because it has ${existingApp._count.roles} associated roles`,
      };
    }

    // Delete application
    await db.application.delete({
      where: { id: validatedData.id },
    });

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: "DELETE_APPLICATION",
      status: "SUCCESS",
      resourceType: "Application",
      resourceId: validatedData.id,
      oldValue: JSON.stringify(existingApp),
    });

    return { success: "Application deleted successfully" };
  } catch (error) {
    console.error("[DELETE_APPLICATION]", error);
    return { error: "Error deleting application" };
  }
}

/**
 * Manage application role access permissions
 */
export async function manageApplicationRoles(data: ManageApplicationRolesInput) {
  try {
    // Verify user authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = manageApplicationRolesSchema.parse(data);

    // Check if application exists
    const existingApp = await db.application.findUnique({
      where: { id: validatedData.applicationId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingApp) {
      return { error: "Application not found" };
    }

    // Verify all role IDs exist
    const roles = await db.role.findMany({
      where: {
        id: {
          in: validatedData.roleIds,
        },
      },
    });

    if (roles.length !== validatedData.roleIds.length) {
      return { error: "Some roles do not exist" };
    }

    // Use transaction to update role associations
    await db.$transaction(async (tx: any) => {
      // Delete existing role associations
      await tx.roleApplication.deleteMany({
        where: {
          applicationId: validatedData.applicationId,
        },
      });

      // Create new role associations
      if (validatedData.roleIds.length > 0) {
        await tx.roleApplication.createMany({
          data: validatedData.roleIds.map((roleId: string) => ({
            applicationId: validatedData.applicationId,
            roleId,
          })),
        });
      }
    });

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: "MANAGE_APPLICATION_ROLES",
      status: "SUCCESS",
      resourceType: "Application",
      resourceId: validatedData.applicationId,
      oldValue: JSON.stringify(existingApp.roles.map((ra: any) => ra.role.id)),
      newValue: JSON.stringify(validatedData.roleIds),
    });

    return { success: "Application role access updated successfully" };
  } catch (error) {
    console.error("[MANAGE_APPLICATION_ROLES]", error);
    return { error: "Error managing application roles" };
  }
}

/**
 * Get all applications
 */
export async function getApplications() {
  try {
    const applications = await db.application.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
      orderBy: [
        { order: "asc" },
        { displayName: "asc" },
      ],
    });

    return { applications };
  } catch (error) {
    console.error("[GET_APPLICATIONS]", error);
    return { error: "Error fetching applications" };
  }
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(id: string) {
  try {
    const application = await db.application.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        menuItems: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
    });

    if (!application) {
      return { error: "Application not found" };
    }

    return { application };
  } catch (error) {
    console.error("[GET_APPLICATION_BY_ID]", error);
    return { error: "Error fetching application" };
  }
}
