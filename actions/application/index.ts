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
 * 創建新的應用程式
 */
export async function createApplication(data: CreateApplicationInput) {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // 驗證輸入資料
    const validatedData = createApplicationSchema.parse(data);

    // 檢查名稱是否已存在
    const existingByName = await db.application.findUnique({
      where: { name: validatedData.name },
    });

    if (existingByName) {
      return { error: "Application name already exists" };
    }

    // 檢查路徑是否已存在
    const existingByPath = await db.application.findUnique({
      where: { path: validatedData.path },
    });

    if (existingByPath) {
      return { error: "Application path already exists" };
    }

    // 創建應用程式
    const application = await db.application.create({
      data: validatedData,
    });

    // 記錄審計日誌
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
 * 更新應用程式
 */
export async function updateApplication(data: UpdateApplicationInput) {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // 驗證輸入資料
    const validatedData = updateApplicationSchema.parse(data);
    const { id, ...updateData } = validatedData;

    // 檢查應用程式是否存在
    const existingApp = await db.application.findUnique({
      where: { id },
    });

    if (!existingApp) {
      return { error: "Application not found" };
    }

    // 如果更新名稱，檢查新名稱是否已被其他應用程式使用
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

    // 如果更新路徑，檢查新路徑是否已被其他應用程式使用
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

    // 更新應用程式
    const application = await db.application.update({
      where: { id },
      data: updateData,
    });

    // 記錄審計日誌
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
 * 切換應用程式啟用狀態
 */
export async function toggleApplicationStatus(data: ToggleApplicationStatusInput) {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // 驗證輸入資料
    const validatedData = toggleApplicationStatusSchema.parse(data);

    // 檢查應用程式是否存在
    const existingApp = await db.application.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingApp) {
      return { error: "Application not found" };
    }

    // 更新狀態
    const application = await db.application.update({
      where: { id: validatedData.id },
      data: { isActive: validatedData.isActive },
    });

    // 記錄審計日誌
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
 * 刪除應用程式
 */
export async function deleteApplication(data: DeleteApplicationInput) {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // 驗證輸入資料
    const validatedData = deleteApplicationSchema.parse(data);

    // 檢查應用程式是否存在
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

    // 檢查是否有關聯的選單項目或角色
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

    // 刪除應用程式
    await db.application.delete({
      where: { id: validatedData.id },
    });

    // 記錄審計日誌
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
 * 管理應用程式的角色存取權限
 */
export async function manageApplicationRoles(data: ManageApplicationRolesInput) {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // 驗證輸入資料
    const validatedData = manageApplicationRolesSchema.parse(data);

    // 檢查應用程式是否存在
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

    // 驗證所有角色 ID 是否存在
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

    // 使用交易來更新角色關聯
    await db.$transaction(async (tx: any) => {
      // 刪除現有的角色關聯
      await tx.roleApplication.deleteMany({
        where: {
          applicationId: validatedData.applicationId,
        },
      });

      // 創建新的角色關聯
      if (validatedData.roleIds.length > 0) {
        await tx.roleApplication.createMany({
          data: validatedData.roleIds.map((roleId: string) => ({
            applicationId: validatedData.applicationId,
            roleId,
          })),
        });
      }
    });

    // 記錄審計日誌
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
 * 獲取所有應用程式
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
 * 根據 ID 獲取單個應用程式
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
