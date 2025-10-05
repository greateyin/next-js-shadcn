/**
 * 轻量级 Session API - 用于子应用的客户端读取 session
 * 
 * 这个端点使子应用的 useSession() 可以同源访问，避免 CORS 问题
 */

import { NextResponse } from "next/server";
import { getSubdomainSession } from "@/lib/auth/subdomain-auth";

/**
 * GET /api/auth/session
 * 
 * 返回当前用户的 session（如果存在）
 */
export async function GET() {
  try {
    const session = await getSubdomainSession();
    
    if (!session) {
      return NextResponse.json(null);
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error("[SESSION_API]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
