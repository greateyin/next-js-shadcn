# Admin 登入問題修復報告

## 問題描述

Admin 用戶（admin@example.com）登入後出現以下問題：

1. ❌ 登入後被重定向到 `/dashboard` 而不是 `/admin`
2. ❌ 右上角用戶選單只顯示 "U" (Avatar fallback)，沒有顯示用戶名
3. ❌ 右上角用戶選單缺少 Admin 角色標識
4. ❌ 側邊欄只顯示 Dashboard、Profile、Settings，缺少 Admin 選單（Users、Roles、Applications、Menu）

## 根本原因分析

### 1. Middleware JWT Token 問題

**問題根源**：
- `/middleware.ts` 使用獨立的 `NextAuth(edgeAuthConfig)` 實例
- `/auth.ts` 使用另一個 `NextAuth(authConfig)` 實例
- 兩個實例有不同的 JWT callbacks，導致 RBAC 數據丟失

**症狀**：
```typescript
// 登入時 (auth.ts)
token.roleNames = ['admin']  // ✅ 正確設置

// Middleware 讀取時 (edgeAuthConfig)
token.roleNames = []  // ❌ 被重置為空數組
```

**錯誤的架構**：
```
auth.ts (主實例)          middleware.ts (獨立實例)
     ↓                           ↓
authConfig                  edgeAuthConfig
     ↓                           ↓
JWT callback 設置數據      JWT callback 重置數據
```

### 2. 頁面渲染問題

由於 middleware 判斷用戶沒有 admin 權限：
- `/admin` 被重定向到 `/auth/login`
- `/auth/login` 檢測到已登入，重定向到 `/dashboard`
- 結果：顯示 Dashboard 頁面而非 Admin Panel

## 解決方案

### 1. 修復 Middleware 架構（主要修復）

**修改文件**：`/middleware.ts`

**Before**：
```typescript
import NextAuth from "next-auth"
import { edgeAuthConfig } from "./auth.edge.config"

const { auth } = NextAuth(edgeAuthConfig)

export default auth(async function middleware(request: NextRequest) {
  // ...
})
```

**After**：
```typescript
import { auth as mainAuth } from "@/auth"

export default mainAuth(async function middleware(request: NextRequest) {
  // ...
})
```

**原理**：
- 使用主 auth 實例確保 JWT callbacks 一致
- Auth.js V5 自動處理 Edge runtime 兼容性
- 在 Edge runtime 中，Prisma adapter 不會被調用

### 2. 簡化 Edge 配置（次要修復）

**修改文件**：`/auth.edge.config.ts`

移除嘗試重新設置 RBAC 數據的邏輯：

```typescript
callbacks: {
  async jwt({ token }) {
    // ⚠️ CRITICAL: Do NOT modify token here!
    // The token already contains all RBAC data from auth.config.ts
    return token
  },
}
```

## 技術細節

### Auth.js V5 正確架構

根據官方文檔，正確的架構應該是：

1. **auth.config.ts** - 基礎配置（providers、callbacks）
2. **auth.ts** - 完整實例（加入 Prisma adapter）
3. **middleware.ts** - 使用 auth.ts 導出的 `auth` 函數

```typescript
// auth.config.ts
export default {
  providers: [Google, GitHub, Credentials],
  callbacks: {
    async jwt({ token, user }) {
      // 設置 RBAC 數據
      if (user) {
        token.roleNames = userRolesAndPermissions.roles.map(r => r.name)
      }
      return token
    }
  }
}

// auth.ts
export const { auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig
})

// middleware.ts
import { auth } from "@/auth"
export default auth((req) => {
  // JWT token 已包含完整的 roleNames 數據
})
```

### 為什麼需要兩個配置文件？

**不需要！** 實際上只需要一個配置：

- **auth.config.ts** - 包含所有配置
- **auth.ts** - 添加 adapter 並導出實例
- **middleware.ts** - 直接使用 auth.ts 的實例

## 驗證步驟

### 1. 檢查 JWT Token

登入後，middleware 應該輸出：

```
[Middleware] Request: {
  pathname: '/admin',
  isAuthenticated: true,
  tokenRoles: ['admin'],
  userHasAdminPrivileges: true
}
```

### 2. 檢查頁面渲染

訪問 `/admin` 應該：
- ✅ 成功渲染 Admin Panel
- ✅ 顯示 AdminSidebar（包含 Users、Roles、Applications、Menu）
- ✅ 顯示 AdminHeader（顯示用戶名、角色標識）

### 3. 檢查用戶選單

右上角用戶選單應該顯示：
- ✅ 用戶頭像或名字首字母（"A" for Admin User）
- ✅ 用戶全名 "Admin User"
- ✅ 用戶郵箱 "admin@example.com"
- ✅ Profile 和 Settings 選項

## 測試建議

1. **清除瀏覽器 Cookies** - 確保使用新的 JWT token
2. **重新登入** - 使用 admin@example.com / Admin@123
3. **檢查控制台日誌** - 查看 token 數據
4. **訪問 /admin** - 確認正確渲染

## 相關文件

- `/middleware.ts` - 主要修改
- `/auth.edge.config.ts` - 次要修改
- `/auth.config.ts` - JWT callback 設置 RBAC 數據
- `/auth.ts` - 導出主 auth 實例
- `/app/admin/layout.tsx` - Admin 頁面 layout
- `/components/admin/AdminLayoutClient.tsx` - Admin 布局
- `/components/admin/AdminSidebar.tsx` - Admin 側邊欄
- `/components/admin/AdminHeader.tsx` - Admin 頭部

## 注意事項

⚠️ **關鍵要點**：
1. Middleware 必須使用主 auth 實例
2. Edge 配置不應該修改 JWT token
3. JWT token 已在登入時設置好所有 RBAC 數據
4. Auth.js V5 自動處理 Edge runtime 兼容性

## 參考資料

- [Auth.js V5 Edge Compatibility](https://authjs.dev/guides/edge-compatibility)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auth.js Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
