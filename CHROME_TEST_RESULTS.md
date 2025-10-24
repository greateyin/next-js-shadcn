# 🧪 Chrome DevTools MCP 測試結果

## 測試環境
- **URL**: https://auth.most.tw
- **測試帳號**: admin@example.com / Admin@123
- **測試時間**: 2025-10-25 01:43 UTC+8

---

## 🔴 發現的問題

### 問題 1: Admin 登入後重定向到 /dashboard 而非 /admin

**測試步驟**：
1. 訪問 https://auth.most.tw/auth/login
2. 登入 admin@example.com / Admin@123
3. 觀察重定向目標

**預期結果**：
- ✅ 應該重定向到 `/admin`

**實際結果**：
- ❌ 重定向到 `/dashboard`

**網絡請求追蹤**：
```
POST /auth/login → 303 (See Other)
  ↓ (重定向)
GET /dashboard → 200 OK
```

---

### 問題 2: Admin 用戶無法訪問 /admin

**測試步驟**：
1. 在 /dashboard 頁面
2. 點擊側邊欄的 "Admin Panel" 鏈接
3. 或直接訪問 https://auth.most.tw/admin

**預期結果**：
- ✅ 應該導航到 `/admin` 並顯示 Admin Panel

**實際結果**：
- ❌ 被重定向回 `/dashboard`
- ❌ URL 保持在 `/dashboard`

**網絡請求追蹤**：
```
GET /admin?_rsc=skepm → 307 (Temporary Redirect)
  ↓ Location: /auth/login
GET /auth/login → 307 (Temporary Redirect)
  ↓ (authenticated)
GET /dashboard → 200 OK
```

**響應頭分析**：
```http
HTTP/1.1 307 Temporary Redirect
Location: /auth/login
Set-Cookie: __Secure-authjs.callback-url=https%3A%2F%2Fauth.most.tw%2Fdashboard
Set-Cookie: __Secure-authjs.session-token=eyJhbGci... (JWT token)
```

---

## 🔍 根本原因分析

### 原因 1: Middleware 未部署最新代碼

我們修改了 `middleware.ts` 使用 Auth.js V5 的 `auth()` 包裝：

```typescript
// 修改後的代碼
const { auth } = NextAuth(edgeAuthConfig)

export default auth(async function middleware(request: NextRequest) {
  const token = (request as AuthenticatedRequest).auth
  // ...
})
```

**但是**：
- ❌ 代碼可能還沒有推送到 Vercel
- ❌ 或者 Vercel 使用了舊的構建緩存

**證據**：
- Middleware 返回 307 重定向到 `/auth/login`
- 說明 middleware 認為用戶未認證或沒有 admin 權限
- 但 session-token cookie 已存在

### 原因 2: edgeAuthConfig 缺少 JWT callbacks

`auth.edge.config.ts` 中的 callbacks 是最小化的：

```typescript
callbacks: {
  async jwt({ token }) { return token },
  async session({ session }) { return session },
}
```

**問題**：
- ❌ 沒有包含 RBAC 數據（roleNames, permissionNames）
- ❌ JWT token 中可能缺少必要的權限信息
- ❌ `userHasAdminPrivileges()` 無法正確檢查角色

### 原因 3: Middleware 邏輯問題

從網絡請求看，middleware 執行了以下邏輯：

```typescript
// middleware.ts line 214-239
if (isAuthenticated && (isAdminPage || isApiAdminRoute)) {
  if (userHasAdminPrivileges) {
    return NextResponse.next() // ✅ 允許訪問
  }
  // ...
  // ❌ 沒有 admin 權限，重定向
  return NextResponse.redirect(new URL('/no-access', request.url))
}
```

**但實際行為**：
- 用戶訪問 `/admin` → 重定向到 `/auth/login`
- 這說明 `isAuthenticated` 可能是 false

---

## 📊 Session Token 分析

**Cookie 內容**：
```
__Secure-authjs.session-token=eyJhbGci...
__Secure-authjs.callback-url=https%3A%2F%2Fauth.most.tw%2Fdashboard
```

**JWT Token 結構**：
```json
{
  "alg": "dir",
  "enc": "A256CBC-HS512",
  "kid": "aEFGORo9_GmHe93Fb23EQIAV..."
}
```

**問題**：
- ✅ Token 存在
- ❌ Middleware 無法解析或驗證 token
- ❌ 或 token 中缺少 RBAC 數據

---

## 🔧 解決方案

### 解決方案 1: 更新 edgeAuthConfig callbacks

**文件**: `auth.edge.config.ts`

```typescript
export const edgeAuthConfig: NextAuthConfig = {
  // ... 其他配置

  callbacks: {
    async jwt({ token, user }) {
      // ✅ 從完整 auth.config.ts 複製 JWT callback
      if (user) {
        token.id = user.id
        token.roleNames = user.roleNames
        token.permissionNames = user.permissionNames
        token.applicationPaths = user.applicationPaths
      }
      return token
    },
    
    async session({ session, token }) {
      // ✅ 從完整 auth.config.ts 複製 session callback
      if (token) {
        session.user.id = token.id as string
        session.user.roleNames = token.roleNames as string[]
        session.user.permissionNames = token.permissionNames as string[]
        session.user.applicationPaths = token.applicationPaths as string[]
      }
      return session
    },
  },
}
```

**原因**：
- Edge config 需要包含 RBAC 數據
- Middleware 依賴這些數據來檢查權限

### 解決方案 2: 檢查 Auth.js V5 auth() 使用方式

當前 middleware 結構：

```typescript
const { auth } = NextAuth(edgeAuthConfig)

export default auth(async function middleware(request: NextRequest) {
  const token = (request as AuthenticatedRequest).auth
  // ...
})
```

**可能的問題**：
- `request.auth` 可能不是正確的 API
- 需要確認 Auth.js V5 如何在 middleware 中傳遞 session

**替代方案**：使用 `auth()` 返回的 session

```typescript
export default auth((req) => {
  const session = req.auth // Auth.js V5 提供的 session
  const token = session?.user // 獲取用戶數據
  
  // 檢查權限
  const userHasAdminPrivileges = hasAdminPrivileges(token)
  
  // 路由邏輯...
})
```

### 解決方案 3: 推送並重新部署

```bash
# 1. 確認所有修改已提交
git status

# 2. 推送到 Vercel
git push origin main

# 3. 等待 Vercel 部署完成

# 4. 清除瀏覽器緩存後重新測試
```

---

## 📋 待修復清單

### 高優先級 🔴

1. ✅ 更新 `auth.edge.config.ts` 添加完整的 JWT callbacks
2. ✅ 驗證 Auth.js V5 middleware 的正確使用方式
3. ✅ 推送代碼到 Vercel 並重新部署
4. ✅ 清除 Vercel 構建緩存

### 中優先級 🟡

5. ✅ 添加 middleware 調試日誌
6. ✅ 測試不同角色的訪問權限
7. ✅ 驗證 session token 包含正確的 RBAC 數據

### 低優先級 🟢

8. ✅ 優化 Edge config bundle 大小
9. ✅ 添加 E2E 測試覆蓋登入流程
10. ✅ 文檔化 Auth.js V5 遷移過程

---

## 🧪 建議的測試場景

### 測試 1: Admin 登入流程

```bash
1. 訪問 /auth/login
2. 輸入 admin@example.com / Admin@123
3. 點擊登入

預期：重定向到 /admin ✅
實際：重定向到 /dashboard ❌
```

### 測試 2: Admin 訪問 Admin Panel

```bash
1. 已登入的 admin 用戶
2. 在 /dashboard 點擊 "Admin Panel"
3. 或直接訪問 /admin

預期：顯示 Admin Panel ✅
實際：重定向到 /dashboard ❌
```

### 測試 3: 普通用戶訪問 Admin

```bash
1. 登入 user@example.com / User@123
2. 嘗試訪問 /admin

預期：重定向到 /no-access ✅
實際：(待測試)
```

---

## 💡 調試建議

### 1. 添加 Middleware 日誌

```typescript
export default auth(async function middleware(request: NextRequest) {
  const token = (request as AuthenticatedRequest).auth
  
  console.log('[DEBUG] Middleware:', {
    pathname: request.nextUrl.pathname,
    hasToken: !!token,
    tokenData: token ? {
      id: token.id,
      email: token.email,
      roleNames: token.roleNames,
    } : null,
    isAuthenticated: !!token,
    userHasAdminPrivileges: hasAdminPrivileges(token),
  })
  
  // ... 其餘邏輯
})
```

### 2. 檢查 Vercel 日誌

```bash
# 訪問 Vercel Dashboard
https://vercel.com/your-org/auth-most-tw/logs

# 搜索 middleware 日誌
Filter: "Middleware"
```

### 3. 本地測試

```bash
# 本地運行
pnpm dev

# 訪問 http://localhost:3000
# 測試登入流程
# 查看終端日誌
```

---

## 📦 相關文件

- ❌ `/middleware.ts` - 使用 Auth.js V5 auth() (未部署)
- ❌ `/auth.edge.config.ts` - Edge 配置缺少 callbacks (未部署)
- ✅ `/auth.config.ts` - 完整配置 (已部署)
- ✅ `/auth.ts` - Auth.js 初始化 (已部署)

---

## 🎯 下一步行動

1. **立即修復**: 更新 `auth.edge.config.ts` 添加完整 callbacks
2. **驗證**: 本地測試 middleware 邏輯
3. **部署**: 推送代碼到 Vercel
4. **測試**: 使用 Chrome DevTools 重新測試
5. **監控**: 檢查 Vercel 日誌確認 middleware 正常運行

---

**測試完成時間**: 2025-10-25 01:45 UTC+8  
**測試工具**: Chrome DevTools MCP  
**測試結果**: ❌ 發現關鍵問題，需要修復
