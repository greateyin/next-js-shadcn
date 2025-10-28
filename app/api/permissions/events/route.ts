import { auth } from "@/auth"
import {
  createSSEResponse,
  initializePermissionNotifications
} from "@/lib/events/permissionNotificationService"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  initializePermissionNotifications()

  return createSSEResponse(session.user.id)
}
