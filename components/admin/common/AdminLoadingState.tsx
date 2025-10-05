import { Loader2 } from "lucide-react";
import { adminStyles } from "@/lib/styles/admin";

interface AdminLoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Admin 加载状态组件
 * 
 * 提供统一的加载状态显示，包含旋转图标和可选文字
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
