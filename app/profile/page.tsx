/**
 * @fileoverview Profile Page - Redirect to Dashboard
 * @module app/profile/page
 * @description Legacy profile route that redirects to dashboard profile
 */

import { redirect } from "next/navigation";

/**
 * Profile Page Component
 * @component
 * @description Redirects to the new dashboard profile page
 * This maintains backward compatibility for any bookmarks or external links
 */
export default function ProfilePage() {
  // Redirect to new dashboard profile location
  redirect("/dashboard/profile");
}
