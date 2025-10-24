# Middleware 認證修復計劃

## 🚨 當前狀態

Middleware 認證已**臨時禁用**以修復 Vercel Edge Runtime 的 `__dirname` 錯誤。

## ⚠️ 安全隱患

目前**所有路由都可直接訪問**，包括：
- `/admin/*` - 管理後台
- `/dashboard/*` - 用戶儀表板
- `/api/admin/*` - 管理 API

## 🔧 臨時防護措施

### 1. Page Level 認證（推薦）

在每個受保護的 layout 中添加：

```typescript
// app/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function DashboardLayout({ children }: { children: React.Node }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/login")
  }
  
  return <>{children}</>
}
```

```typescript
// app/admin/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function AdminLayout({ children }: { children: React.Node }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/login")
  }
  
  const isAdmin = session.user.roleNames?.includes('admin') || 
                 session.user.roleNames?.includes('super-admin')
  
  if (!isAdmin) {
    redirect("/no-access")
  }
  
  return <>{children}</>
}
```

### 2. API Routes 防護

確保所有 admin API routes 使用 `checkAdminAuth`:

```typescript
// app/api/admin/*/route.ts
import { checkAdminAuth } from "@/lib/auth/admin-check"

export async function GET(request: Request) {
  const authResult = await checkAdminAuth()
  if (!authResult.authenticated || !authResult.isAdmin) {
    return authResult.response // 返回 401/403
  }
  
  // 實際邏輯
}
```

## 🎯 永久解決方案選項

### Option 1: 等待 next-auth v5 穩定版

```bash
# 監控 next-auth 更新
pnpm update next-auth@latest
```

### Option 2: 切換到 @auth/core

使用更底層的 `@auth/core` 可能有更好的 Edge Runtime 支持：

```bash
pnpm add @auth/core
pnpm remove next-auth
```

### Option 3: 自定義 JWT 驗證

創建自定義的 Edge-compatible JWT 驗證middleware：

```typescript
import { jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("authjs.session-token")?.value
  
  if (!token && isProtectedRoute(request.pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  // 驗證 JWT...
}
```

## 📋 待辦事項

- [ ] 部署簡化的 middleware（修復 __dirname）
- [ ] 確認網站可以訪問
- [ ] 添加 dashboard layout 認證
- [ ] 添加 admin layout 認證  
- [ ] 驗證所有 admin API routes 有權限檢查
- [ ] 測試完整的認證流程
- [ ] 決定永久解決方案
- [ ] 重新啟用 middleware 認證

## 🔗 相關文件

- `middleware.ts` - 當前簡化版本
- `middleware.ts.backup` - 原始完整版本
- `lib/auth/admin-check.ts` - Admin 權限檢查工具
- `auth.ts` - Auth.js 配置

## ⏰ 優先級

1. **立即**: 部署修復，確保網站可訪問
2. **短期** (1-2天): 添加 page layout 認證
3. **中期** (1週): 實施永久 middleware 解決方案
4. **長期**: 監控 next-auth v5 穩定版發布

---

**最後更新**: 2025-10-24 20:40 UTC+8
**狀態**: 🟡 臨時修復已部署，等待永久解決方案
