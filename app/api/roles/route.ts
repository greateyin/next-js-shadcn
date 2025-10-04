import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/roles
 * 獲取所有角色列表
 */
export async function GET() {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 獲取所有角色
    const roles = await db.role.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("[GET_ROLES]", error);
    return NextResponse.json(
      { error: "獲取角色列表時發生錯誤" },
      { status: 500 }
    );
  }
}
