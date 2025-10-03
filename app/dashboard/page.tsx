import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  const isAdmin = session.user.roleNames?.includes("admin") || session.user.role === "admin";

  if (!isAdmin) {
    redirect("/no-access");
  }

  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}
