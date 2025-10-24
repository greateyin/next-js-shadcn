# 🚨 緊急修復：Edge Config 缺少 RBAC 數據

## 問題摘要

從 Chrome DevTools MCP 測試發現，Admin 用戶無法訪問 `/admin` 頁面：

```
❌ Admin 登入後 → 重定向到 /dashboard（應該去 /admin）
❌ 訪問 /admin → 307 重定向 → /auth/login → /dashboard
✅ Session token 已設置
❌ Middleware 無法識別用戶為 admin
```

---

## 🔍 根本原因

### `auth.edge.config.ts` 的 callbacks 太簡單

**之前的代碼**：
```typescript
callbacks: {
  async jwt({ token }) { return token },
  async session({ session }) { return session },
}
```

**問題**：
- ❌ JWT token 中**沒有包含** `roleNames`
- ❌ JWT token 中**沒有包含** `permissionNames`
- ❌ JWT token 中**沒有包含** `applicationPaths`
- ❌ Middleware 無法判斷用戶是否為 admin

**導致**：
```typescript
// middleware.ts line 227
if (userHasAdminPrivileges) {  // ← 永遠是 false！
  return NextResponse.next()
}
```

---

## ✅ 修復方案

### 更新 `auth.edge.config.ts` 添加完整 RBAC callbacks

**修復後的代碼**：
```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    // On sign in, user object contains RBAC data from authorize()
    if (user) {
      const extendedUser = user as any
      
      token.id = user.id
      token.email = user.email
      token.name = user.name
      token.picture = user.image
      token.status = extendedUser.status
      token.role = extendedUser.role
      
      // ⚠️ Critical: RBAC data from full auth.config.ts
      token.roleNames = extendedUser.roleNames || []
      token.permissionNames = extendedUser.permissionNames || []
      token.applicationPaths = extendedUser.applicationPaths || []
    }
    
    return token
  },
  
  async session({ session, token }) {
    if (token && session.user) {
      session.user.id = token.id as string
      session.user.email = token.email as string
      session.user.name = token.name as string | null
      session.user.image = token.picture as string | null
      session.user.status = token.status as any
      session.user.role = token.role as string
      
      // ⚠️ Critical: Pass RBAC data to session
      session.user.roleNames = (token.roleNames as string[]) || []
      session.user.permissionNames = (token.permissionNames as string[]) || []
      session.user.applicationPaths = (token.applicationPaths as string[]) || []
    }
    return session
  },
}
```

**修復內容**：
- ✅ 從 `user` 對象複製 RBAC 數據到 `token`
- ✅ 從 `token` 複製 RBAC 數據到 `session`
- ✅ Middleware 現在可以讀取 `roleNames` 判斷權限

---

## 🔄 數據流程

### 登入時的數據流

```
1. 用戶登入 (POST /auth/login)
   ↓
2. auth.config.ts → authorize()
   - 查詢數據庫
   - 驗證密碼
   - 加載角色和權限
   ↓
3. auth.config.ts → jwt() callback
   - 將 RBAC 數據存入 JWT token
   - roleNames: ['admin']
   - permissionNames: [...]
   - applicationPaths: ['/dashboard', '/admin']
   ↓
4. JWT token 加密並設置為 cookie
   - __Secure-authjs.session-token=eyJhbGci...
```

### Middleware 驗證時的數據流

```
5. 用戶訪問 /admin
   ↓
6. Middleware (Edge Runtime)
   - 使用 auth.edge.config.ts
   ↓
7. auth.edge.config.ts → jwt() callback
   - ⚠️ 之前：返回空的 token
   - ✅ 現在：保留 RBAC 數據
   ↓
8. Middleware 獲取 token
   - token.roleNames = ['admin']
   ↓
9. hasAdminPrivileges(token)
   - 檢查 roleNames 是否包含 'admin'
   - ✅ 返回 true
   ↓
10. NextResponse.next()
    - ✅ 允許訪問 /admin
```

---

## 📊 修復對比

### 修復前（Chrome DevTools 測試結果）

```
GET /admin → 307 Redirect to /auth/login
  ↓
Middleware:
  - token.roleNames = undefined ❌
  - userHasAdminPrivileges = false ❌
  - 判斷：無權限 ❌
  ↓
Result: 重定向到 /auth/login
```

### 修復後（預期結果）

```
GET /admin → 200 OK
  ↓
Middleware:
  - token.roleNames = ['admin'] ✅
  - userHasAdminPrivileges = true ✅
  - 判斷：有權限 ✅
  ↓
Result: 顯示 Admin Panel
```

---

## 🚀 部署步驟

### 1. 推送代碼到 Vercel

```bash
# 檢查修改
git status

# 添加修改的文件
git add auth.edge.config.ts
git add CRITICAL_FIX_EDGE_CONFIG.md
git add CHROME_TEST_RESULTS.md

# 提交
git commit -m "fix(auth): add RBAC data to edge config callbacks

Critical fix:
- Add roleNames, permissionNames, applicationPaths to JWT token
- Fix admin user unable to access /admin pages
- Middleware can now correctly identify admin privileges

Chrome DevTools testing revealed that edge config was missing
RBAC data, causing all admin checks to fail. This fix ensures
JWT tokens contain necessary role and permission information
for middleware authorization checks.

Fixes: Admin redirect loop /admin → /auth/login → /dashboard"

# 推送
git push origin main
```

### 2. 監控 Vercel 部署

```bash
# 訪問 Vercel Dashboard
https://vercel.com/your-org/auth-most-tw/deployments

# 等待部署完成（約 1-2 分鐘）
✅ Building...
✅ Deploying...
✅ Ready
```

### 3. 清除瀏覽器並測試

```bash
1. 清除瀏覽器緩存和 Cookie
   - Chrome: Cmd+Shift+Delete → 清除數據
   
2. 訪問 https://auth.most.tw/auth/login

3. 登入 admin@example.com / Admin@123

4. 預期結果：
   ✅ 重定向到 /admin
   ✅ 顯示 Admin Panel
   ✅ 側邊欄顯示 admin 菜單

5. 測試導航：
   ✅ 點擊 "Back to Dashboard" → 去 /dashboard
   ✅ 點擊 "Admin Panel" → 去 /admin
```

---

## 🧪 驗證檢查清單

### Admin 用戶測試

- [ ] 登入後重定向到 `/admin`
- [ ] 可以訪問 `/admin/users`
- [ ] 可以訪問 `/admin/roles`
- [ ] 可以在 dashboard 和 admin 間切換
- [ ] Middleware 日誌顯示 `hasToken: true, userHasAdminPrivileges: true`

### 普通用戶測試

- [ ] 登入後重定向到 `/dashboard`
- [ ] 訪問 `/admin` 被重定向到 `/no-access`
- [ ] 側邊欄不顯示 admin 相關菜單

### Moderator 用戶測試

- [ ] 登入後重定向到 `/dashboard`
- [ ] 訪問 `/admin` 被重定向到 `/no-access`
- [ ] 可以通過權限訪問特定 admin 資源（如果有）

---

## 📋 相關文件

### 已修復
- ✅ `auth.edge.config.ts` - 添加完整 RBAC callbacks
- ✅ `middleware.ts` - 使用 Auth.js V5 auth() wrapper
- ✅ `app/dashboard/page.tsx` - 限定菜單範圍

### 無需修改
- ✅ `auth.config.ts` - 完整配置（登入時使用）
- ✅ `auth.ts` - Auth.js 初始化
- ✅ 數據庫菜單數據 - 已正確配置

---

## 🔍 調試技巧

### 查看 Vercel 日誌

```bash
# 訪問 Vercel Functions 日誌
https://vercel.com/your-org/auth-most-tw/logs

# 搜索 middleware 日誌
Filter: "Middleware"

# 檢查輸出
[Middleware] Request: {
  pathname: '/admin',
  isAuthenticated: true,        // ✅ 應該是 true
  hasToken: true,                // ✅ 應該是 true
  tokenEmail: 'admin@example.com',
  tokenRoles: ['admin'],         // ✅ 關鍵！應該包含 'admin'
  userHasAdminPrivileges: true   // ✅ 應該是 true
}
```

### 本地測試命令

```bash
# 運行開發服務器
pnpm dev

# 訪問
http://localhost:3000/auth/login

# 查看終端日誌
# 應該顯示 middleware 日誌
```

---

## 💡 為什麼分離 Edge Config？

### 問題：Edge Function 大小限制

```
❌ 之前使用完整 authConfig
   - 包含 Prisma Adapter
   - 包含數據庫依賴
   - Bundle 大小：1.03 MB
   - 超過 Vercel 限制：1 MB

✅ 現在使用 edgeAuthConfig
   - 不包含 Prisma
   - 不包含數據庫操作
   - Bundle 大小：~180 KB
   - 符合 Vercel 限制
```

### 關鍵：Edge Config 必須包含 RBAC callbacks

```typescript
// ❌ 錯誤：只返回基本 token
callbacks: {
  async jwt({ token }) { return token }
}

// ✅ 正確：保留 RBAC 數據
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.roleNames = user.roleNames  // 關鍵！
    }
    return token
  }
}
```

---

## 🎯 預期效果

### 登入流程

```
admin@example.com 登入
  ↓
POST /auth/login
  - auth.config.ts (完整配置)
  - 查詢數據庫加載 RBAC 數據
  - JWT callback 存入 token
  ↓
303 Redirect to /admin
  ↓
GET /admin
  - middleware.ts (Edge Runtime)
  - auth.edge.config.ts (輕量配置)
  - JWT callback 保留 RBAC 數據
  - 檢查 roleNames = ['admin']
  - userHasAdminPrivileges = true
  ↓
200 OK - 顯示 Admin Panel ✅
```

### 導航流程

```
在 /dashboard 點擊 "Admin Panel"
  ↓
GET /admin
  - Middleware 檢查權限
  - roleNames = ['admin']
  - 允許訪問
  ↓
顯示 Admin Panel ✅
```

---

## 📊 性能影響

### Bundle 大小
- ✅ Edge Config: ~180 KB (符合限制)
- ✅ 完整 Config: 使用於 Server Components

### 運行時性能
- ✅ Middleware: Edge Runtime (全球分佈，低延遲)
- ✅ JWT 驗證: 純計算，無數據庫查詢
- ✅ RBAC 檢查: 從 token 讀取，毫秒級

---

## ✅ 檢查清單

部署前：
- [x] 修改 `auth.edge.config.ts`
- [x] 添加 RBAC callbacks
- [x] TypeScript 編譯通過
- [ ] 推送到 Git

部署後：
- [ ] Vercel 部署成功
- [ ] 清除瀏覽器緩存
- [ ] 測試 admin 登入
- [ ] 測試 /admin 訪問
- [ ] 測試應用切換
- [ ] 檢查 Vercel 日誌

---

**修復時間**: 2025-10-25 01:50 UTC+8  
**狀態**: ✅ 代碼已修復，待部署測試  
**優先級**: 🔴 緊急 - 核心功能無法使用  
**預期修復時間**: 5 分鐘（推送 + 部署 + 測試）
