# Edge Runtime Auth 修復文檔

## 問題描述

使用主 auth 實例會超過 Vercel Edge Function 1MB 限制，因此必須使用獨立的 `edgeAuthConfig`。但這導致 JWT token 中的 RBAC 數據（roleNames）在 middleware 中丟失。

## 根本原因

兩個 NextAuth 實例配置不一致：
1. **auth.config.ts** (完整配置) - 登入時使用，包含 Prisma adapter
2. **auth.edge.config.ts** (輕量配置) - Middleware 使用，無 database

**問題**：如果配置不匹配（providers、cookies、session 設置等），兩個實例無法正確共享 JWT token。

## 解決方案

### 修改 1：確保配置一致性（/auth.edge.config.ts）

關鍵修改：

1. **OAuth Providers 必須匹配**：
```typescript
Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  allowDangerousEmailAccountLinking: true, // ⚠️ 必須與 auth.config.ts 匹配
}),
```

2. **Cookie 設置必須匹配**：
```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN || undefined, // ⚠️ 必須匹配
      maxAge: 30 * 24 * 60 * 60, // ⚠️ 必須匹配
    },
  },
},
```

3. **Session 設置必須匹配**：
```typescript
session: {
  strategy: "jwt" as const,
  maxAge: 30 * 24 * 60 * 60, // ⚠️ 必須匹配
  updateAge: 24 * 60 * 60, // ⚠️ 必須匹配
},
```

4. **Trust Host 設置必須匹配**：
```typescript
trustHost: true, // ⚠️ 必須匹配
```

5. **JWT Callback 只讀取，不修改**：
```typescript
async jwt({ token, user, trigger }) {
  // ⚠️ CRITICAL: 不要修改 token
  // roleNames、permissionNames 等數據已在登入時設置
  
  console.log('[Edge JWT Callback]', {
    trigger,
    email: token?.email,
    roleNames: token?.roleNames, // 應該包含 ['admin']
  })
  
  // 直接返回 token，保留所有數據
  return token
}
```

## JWT Token 流程

### 登入流程（使用 auth.config.ts）

```typescript
// 1. 用戶登入
POST /auth/login
  ↓
// 2. auth.config.ts JWT callback 被調用
async jwt({ token, user }) {
  if (user) {
    // 從數據庫獲取角色
    const roles = await getUserRolesAndPermissions(user.id)
    token.roleNames = roles.roles.map(r => r.name) // ['admin']
    token.permissionNames = roles.permissions.map(p => p.name)
    token.applicationPaths = roles.applications.map(a => a.path)
  }
  return token
}
  ↓
// 3. Token 被加密並存儲在 cookie
Cookie: __Secure-authjs.session-token = <encrypted JWT>
```

### Middleware 流程（使用 edgeAuthConfig）

```typescript
// 1. 訪問受保護的路由
GET /admin
  ↓
// 2. Middleware 讀取 cookie
const token = await getToken({ req })
  ↓
// 3. edgeAuthConfig JWT callback 被調用
async jwt({ token }) {
  // token 已包含 roleNames = ['admin']
  console.log(token.roleNames) // ['admin']
  return token // 不修改，直接返回
}
  ↓
// 4. 檢查權限
hasAdminPrivileges(token) // token.roleNames 包含 'admin' → true
  ↓
// 5. 允許訪問
NextResponse.next()
```

## 驗證步驟

### 1. 部署前檢查

確保以下設置在兩個配置文件中一致：

| 設置項 | auth.config.ts | auth.edge.config.ts |
|--------|---------------|-------------------|
| OAuth providers | ✅ Google, GitHub, Credentials | ✅ 必須匹配 |
| allowDangerousEmailAccountLinking | ✅ true | ✅ true |
| Cookie name | ✅ __Secure-authjs.session-token | ✅ 必須匹配 |
| Cookie domain | ✅ COOKIE_DOMAIN | ✅ 必須匹配 |
| Cookie maxAge | ✅ 30 days | ✅ 必須匹配 |
| Session maxAge | ✅ 30 days | ✅ 必須匹配 |
| trustHost | ✅ true | ✅ true |

### 2. 部署後測試

**步驟**：

1. **清除瀏覽器 Cookies**
   - 打開 DevTools → Application → Cookies
   - 刪除所有 `auth.most.tw` 的 cookies

2. **登入測試**
   ```
   訪問：https://auth.most.tw/auth/login
   帳號：admin@example.com
   密碼：Admin@123
   ```

3. **檢查日誌**（Vercel Dashboard → Functions → Logs）

   **登入時應該看到**：
   ```
   [JWT Callback] User logged in: {
     userId: "...",
     email: "admin@example.com"
   }
   
   [JWT Callback] Token created: {
     userId: "...",
     roleNames: ["admin"],
     permissionNames: 21,
     applicationPaths: ["dashboard", "admin"]
   }
   ```

   **訪問 /admin 時應該看到**：
   ```
   [Edge JWT Callback] {
     trigger: undefined,
     hasUser: false,
     email: "admin@example.com",
     roleNames: ["admin"],  ← 關鍵：應該有值
     permissionNames: 21,
     applicationPaths: ["dashboard", "admin"]
   }
   
   [Middleware] Request: {
     pathname: "/admin",
     isAuthenticated: true,
     tokenRoles: ["admin"],  ← 關鍵：應該有值
     userHasAdminPrivileges: true  ← 關鍵：應該是 true
   }
   ```

4. **驗證重定向**

   ✅ **預期行為**：
   - 登入後自動跳轉到 `/admin`
   - URL 保持在 `/admin`
   - 顯示 Admin Panel 界面

   ❌ **錯誤行為**（如果配置不匹配）：
   - 登入後跳轉到 `/dashboard`
   - 訪問 `/admin` 被重定向回 `/dashboard`
   - 日誌顯示 `roleNames: []` 或 `undefined`

5. **驗證界面**

   訪問 `/admin` 應該顯示：
   - ✅ Admin Panel 標題
   - ✅ 側邊欄包含：Overview、Users、Roles、Applications、Menu
   - ✅ 右上角顯示用戶名 "Admin User" 或首字母 "A"
   - ✅ 用戶選單顯示完整資訊

## 常見問題排查

### 問題 1：roleNames 仍然為空

**症狀**：日誌顯示 `roleNames: []`

**原因**：
1. Cookie 設置不匹配（domain、maxAge 等）
2. Session 設置不匹配
3. JWT secret 不同（AUTH_SECRET）

**解決**：
1. 檢查 `.env` 文件中的 `AUTH_SECRET`
2. 確認兩個配置文件的所有設置都匹配
3. 清除瀏覽器 cookies 重新登入

### 問題 2：仍然重定向到 /dashboard

**症狀**：訪問 `/admin` 被重定向

**原因**：
1. Middleware 無法識別 admin 權限
2. Token 解密失敗

**解決**：
1. 檢查 Vercel 日誌中的錯誤
2. 確認 `hasAdminPrivileges(token)` 返回 true
3. 檢查 middleware.ts 中的 ADMIN_ROLES 設置

### 問題 3：超過 1MB 限制

**症狀**：部署失敗或 middleware 報錯

**原因**：
1. 不小心引入了 Prisma 或其他大型依賴
2. 在 middleware.ts 中引入了非 Edge 兼容的模組

**解決**：
1. 確保 middleware.ts 只引入 Edge 兼容的模組
2. 檢查 bundle size：`vercel build --prod`
3. 使用 `edgeAuthConfig` 而不是主 auth 實例

## Bundle Size 優化

### Middleware Bundle 檢查

```bash
# 本地檢查
pnpm build
du -sh .next/server/middleware.js

# 應該小於 1MB
```

### 保持輕量的技巧

1. **不要在 middleware 中引入**：
   - ❌ Prisma Client
   - ❌ Database helpers
   - ❌ Heavy crypto libraries
   - ❌ Node.js 內建模組

2. **可以在 middleware 中引入**：
   - ✅ Next.js utilities
   - ✅ Web APIs (fetch, URL, Response)
   - ✅ JWT helpers
   - ✅ 輕量的工具函數

## 部署檢查清單

- [ ] 確認 `auth.edge.config.ts` 已更新
- [ ] 確認所有設置與 `auth.config.ts` 匹配
- [ ] 本地測試通過
- [ ] 清除瀏覽器 cookies
- [ ] 部署到 Vercel
- [ ] 檢查 Vercel 日誌
- [ ] 測試登入流程
- [ ] 驗證 `/admin` 訪問
- [ ] 確認用戶選單顯示正確

## 相關文件

- `/middleware.ts` - Edge middleware
- `/auth.edge.config.ts` - Edge auth 配置（本次修改）
- `/auth.config.ts` - 完整 auth 配置
- `/auth.ts` - Auth 實例導出
- `/app/admin/layout.tsx` - Admin 頁面 layout

## 技術參考

- [Vercel Edge Functions Limits](https://vercel.com/docs/functions/edge-functions/limits)
- [Auth.js Edge Compatibility](https://authjs.dev/guides/edge-compatibility)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
