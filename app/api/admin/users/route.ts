import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/crypto"

/**
 * GET /api/admin/users
 * Get all users
 */
export async function GET() {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const users = await db.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        loginMethods: true
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
 * Create new user
 */
export async function POST(req: Request) {
  try {
    const { error } = await checkAdminAuth()
    if (error) return error

    const body = await req.json()
    const {
      name,
      email,
      password,
      status,
      phoneNumber,
      isTwoFactorEnabled,
      emailVerified,
      loginMethods,
    } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    const normalizedLoginMethods: string[] = Array.isArray(loginMethods)
      ? Array.from(new Set(loginMethods.map((method: string) => method.trim()).filter(Boolean)))
      : []

    if (password && !normalizedLoginMethods.includes("password")) {
      normalizedLoginMethods.push("password")
    }

    const createdUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          status: status || "pending",
          phoneNumber: phoneNumber || null,
          isTwoFactorEnabled: !!isTwoFactorEnabled,
          emailVerified: emailVerified ? new Date() : null,
        },
      })

      if (normalizedLoginMethods.length) {
        await tx.loginMethod.createMany({
          data: normalizedLoginMethods.map((method) => ({
            userId: user.id,
            method,
          })),
          skipDuplicates: true,
        })
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          loginMethods: true,
        },
      })
    })

    return NextResponse.json({ user: createdUser }, { status: 201 })
  } catch (error) {
    console.error("[USERS_POST]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
