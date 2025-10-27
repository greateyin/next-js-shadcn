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
    const { error } = await checkAdminAuth()
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
      loginAttempts,
      phoneNumber,
      loginMethods,
    } = body

    const normalizedLoginMethods: string[] | undefined = Array.isArray(loginMethods)
      ? Array.from(new Set(loginMethods.map((method: string) => method.trim()).filter(Boolean)))
      : undefined

    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          id: userId
        },
        data: {
          name,
          email,
          status,
          image: image || null,
          phoneNumber: phoneNumber || null,
          isTwoFactorEnabled: isTwoFactorEnabled ?? false,
          emailVerified: emailVerified ? new Date() : null,
          loginAttempts: loginAttempts ?? 0,
          // Reset login attempt timestamp if resetting attempts
          ...(loginAttempts === 0 && { loginAttemptsResetAt: new Date() })
        },
      })

      if (normalizedLoginMethods) {
        const existing = await tx.loginMethod.findMany({
          where: { userId },
          select: { id: true, method: true },
        })

        const existingMethods = new Set(existing.map((method) => method.method))
        const desiredMethods = new Set(normalizedLoginMethods)

        // Delete methods no longer desired
        const methodsToDelete = existing
          .filter((method) => !desiredMethods.has(method.method))
          .map((method) => method.id)

        if (methodsToDelete.length) {
          await tx.loginMethod.deleteMany({
            where: { id: { in: methodsToDelete } },
          })
        }

        // Create new methods
        const methodsToCreate = normalizedLoginMethods.filter(
          (method) => !existingMethods.has(method)
        )

        if (methodsToCreate.length) {
          await tx.loginMethod.createMany({
            data: methodsToCreate.map((method) => ({
              userId,
              method,
            })),
            skipDuplicates: true,
          })
        }
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

    return NextResponse.json({ user: updatedUser })
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
