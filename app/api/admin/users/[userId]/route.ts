import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * PATCH /api/admin/users/[userId]
 * Update user
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { userId } = await params
    const body = await req.json()
    const { 
      name, 
      email, 
      status, 
      image, 
      isTwoFactorEnabled, 
      emailVerified, 
      loginAttempts 
    } = body

    const user = await db.user.update({
      where: {
        id: userId
      },
      data: {
        name,
        email,
        status,
        image: image || null,
        isTwoFactorEnabled: isTwoFactorEnabled ?? false,
        emailVerified: emailVerified ? new Date() : null,
        loginAttempts: loginAttempts ?? 0,
        // Reset login attempt timestamp if resetting attempts
        ...(loginAttempts === 0 && { loginAttemptsResetAt: new Date() })
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[USER_PATCH]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete user
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { userId } = await params

    // Prevent deleting yourself
    if (session.user.id === userId) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    await db.user.delete({
      where: {
        id: userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[USER_DELETE]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
