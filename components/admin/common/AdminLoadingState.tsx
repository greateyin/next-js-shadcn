import { Loader2 } from "lucide-react";
import { adminStyles } from "@/lib/styles/admin";

interface AdminLoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Admin loading state component
 * 
 * Provides unified loading state display with spinner icon and optional text
 * 
 * @example
 * <AdminLoadingState />
 * 
 * @example
 * <AdminLoadingState message="Loading users..." />
 */
export function AdminLoadingState({ 
  message = "Loading...",
  className 
}: AdminLoadingStateProps) {
  return (
    <div className={`${adminStyles.loading.container} ${className || ""}`}>
      <div className="flex items-center gap-2">
        <Loader2 className={adminStyles.loading.icon} />
        <div className={adminStyles.loading.text}>{message}</div>
      </div>
    </div>
  );
}
