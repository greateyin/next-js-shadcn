import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/crypto"

/**
 * GET /api/admin/users
 * 獲取所有用戶
 */
export async function GET() {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const users = await db.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[USERS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * 創建新用戶
 */
export async function POST(req: Request) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const body = await req.json()
    const { name, email, password, status } = body

    // 檢查 email 是否已存在
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // 創建用戶
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: status || "pending",
        emailVerified: status === "active" ? new Date() : null
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("[USERS_POST]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
