import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { db } from "@/lib/db"

/**
 * GET /api/admin/roles/[roleId]/applications
 * Get role's applications
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params

    const roleApplications = await db.roleApplication.findMany({
      where: {
        roleId
      },
      select: {
        applicationId: true
      }
    })

    const applicationIds = roleApplications.map((ra: { applicationId: string }) => ra.applicationId)

    return NextResponse.json({ applicationIds })
  } catch (error) {
    console.error("[ROLE_APPLICATIONS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/roles/[roleId]/applications
 * Update role's applications (complete replacement)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { error, session } = await checkAdminAuth()
    if (error) return error

    const { roleId } = await params
    const body = await req.json()
    const { applicationIds } = body

    if (!Array.isArray(applicationIds)) {
      return NextResponse.json({ error: "Invalid application IDs" }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx: typeof db) => {
      // Delete all existing application associations
      await tx.roleApplication.deleteMany({
        where: {
          roleId
        }
      })

      // Create new application associations
      if (applicationIds.length > 0) {
        await tx.roleApplication.createMany({
          data: applicationIds.map((applicationId: string) => ({
            roleId,
            applicationId
          }))
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ROLE_APPLICATIONS_PUT]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
