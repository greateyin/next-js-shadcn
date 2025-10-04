import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/applications
 * 獲取所有應用程式列表
 */
export async function GET() {
  try {
    // 驗證使用者身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 獲取所有應用程式
    const applications = await db.application.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        path: true,
        icon: true,
        isActive: true,
        order: true,
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[GET_APPLICATIONS]", error);
    return NextResponse.json(
      { error: "獲取應用程式列表時發生錯誤" },
      { status: 500 }
    );
  }
}
