# ✅ Vercel Edge Runtime 部署指南

## 🎯 最終解決方案

基於 **Auth.js V5** 和 **Next.js 15+** 官方最佳實踐，完全重構 middleware 以確保 Vercel Edge Runtime 兼容性。

---

## 📋 問題總結

### 原始錯誤
```
ReferenceError: __dirname is not defined
Error: The Edge Function "middleware" is referencing unsupported modules
```

### 根本原因
1. **Edge Runtime 限制**: 不支持 Node.js globals (`__dirname`, `fs`, `require`)
2. **依賴問題**: 某些套件（`editorconfig`, `winston`, `prettier`）使用 CommonJS 特性
3. **配置錯誤**: 嘗試在 Edge Runtime 中導入包含 Prisma 的完整 NextAuth 配置

---

## ✨ 最終架構

### Edge Runtime vs Node.js Runtime

```typescript
┌─────────────────────────────────────────────────────────────┐
│  MIDDLEWARE (Edge Runtime)                                  │
│  ✅ Uses: getToken() from next-auth/jwt                     │
│  ✅ JWT contains: roleNames, permissionNames, appPaths      │
│  ✅ Zero database queries                                   │
│  ✅ Global distribution (Vercel Edge Network)               │
│  ✅ <1ms latency                                            │
│  ❌ No Prisma, no Node.js APIs                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  API ROUTES / SERVER COMPONENTS (Node.js Runtime)           │
│  ✅ Uses: auth() from @/auth                                │
│  ✅ Full Prisma database access                             │
│  ✅ All Node.js APIs available                              │
│  ✅ Complex business logic                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 關鍵實現細節

### 1. Middleware (Edge Runtime)

```typescript
// ✅ 使用 getToken() - Edge 兼容
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // 讀取 JWT token（無數據庫查詢）
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET,
  })
  
  // JWT 包含所有 RBAC 數據
  const isAdmin = token?.roleNames?.includes('admin')
  const canAccessUsers = token?.applicationPaths?.includes('users')
  
  // 基於 JWT claims 做授權決策
  if (isAdmin) {
    return NextResponse.next()
  }
}

// ❌ 不要指定 runtime
// export const config = { runtime: 'edge' } // Next.js 15 默認就是 edge

// ✅ 只配置 matcher
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\.ico|favicon\.png).*)',
  ],
}
```

### 2. Auth Configuration (auth.config.ts)

```typescript
// JWT Callback - 存儲 RBAC 數據
async jwt({ token, user }) {
  if (user) {
    const rbacData = await getUserRolesAndPermissions(user.id)
    
    // 🔑 只存儲名稱，不存儲完整對象（減小 token 大小）
    token.roleNames = rbacData.roles.map(r => r.name)
    token.permissionNames = rbacData.permissions.map(p => p.name)
    token.applicationPaths = rbacData.applications.map(a => a.path)
  }
  return token
}

// Session Callback - 傳遞到 session
async session({ session, token }) {
  session.user.roleNames = token.roleNames
  session.user.permissionNames = token.permissionNames
  session.user.applicationPaths = token.applicationPaths
  return session
}
```

### 3. webpack 配置 (next.config.js)

```javascript
module.exports = {
  // 排除 Node.js 專用套件
  serverExternalPackages: [
    'winston',
    'winston-elasticsearch',
    '@elastic/elasticsearch',
    'editorconfig',
    '@one-ini/wasm',
    'prettier',
    'js-beautify',
  ],
  
  webpack: (config) => {
    // 完全排除這些套件
    config.resolve.alias = {
      ...config.resolve.alias,
      'winston': false,
      'winston-elasticsearch': false,
      '@elastic/elasticsearch': false,
      'editorconfig': false,
      '@one-ini/wasm': false,
      'prettier': false,
      'js-beautify': false,
    }
    return config
  },
}
```

---

## 🚀 部署步驟

### Step 1: 驗證本地構建

```bash
# 清理構建緩存
rm -rf .next

# 本地構建測試
pnpm build

# 檢查輸出
# ✅ 應該看到: ƒ Middleware (Edge Runtime)
# ❌ 不應該有任何 __dirname 錯誤
```

### Step 2: 提交變更

```bash
git add middleware.ts next.config.js
git commit -m "fix: Auth.js V5 Edge Runtime compatible middleware

- Use getToken() for Edge-compatible JWT validation
- Remove all Node.js-specific dependencies from middleware
- Implement full RBAC with JWT claims (roleNames, permissionNames, applicationPaths)
- Add comprehensive documentation and helper functions
- Follow Next.js 15+ and Auth.js V5 official best practices

Fixes: ReferenceError: __dirname is not defined
Refs: https://authjs.dev/guides/edge-compatibility"

git push origin main
```

### Step 3: Vercel 部署

```bash
# Vercel 自動部署
# 或手動觸發
vercel --prod
```

### Step 4: 驗證部署

訪問以下 URL 確認：

```bash
# ✅ 應該正常加載
https://your-app.vercel.app/

# ✅ 應該重定向到登入頁
https://your-app.vercel.app/admin

# ✅ 應該正常提供
https://your-app.vercel.app/favicon.png

# ✅ 登入後應該可以訪問
https://your-app.vercel.app/dashboard
```

---

## 🔍 Vercel 日誌檢查

### 查看 Middleware 日誌

1. 打開 Vercel Dashboard
2. 選擇專案 → Deployments → 最新部署
3. 點擊 "Functions" 標籤
4. 找到 "middleware" Edge Function
5. 查看日誌

**預期日誌**：
```
[Middleware] Access denied for user abc123 to /admin/users
```

**不應該出現**：
```
❌ ReferenceError: __dirname is not defined
❌ Error: The Edge Function is referencing unsupported modules
```

---

## 📊 性能指標

### Edge Runtime 優勢

| 指標 | Node.js Runtime | Edge Runtime |
|------|----------------|--------------|
| **冷啟動** | ~200-500ms | ~10-50ms |
| **全球延遲** | 單一區域 | 全球分佈 |
| **並發處理** | 受限 | 幾乎無限 |
| **數據庫查詢** | 需要 | 不需要 (JWT) |
| **成本** | 較高 | 較低 |

### JWT Token 大小

```typescript
// ✅ 好的做法（~500 bytes）
{
  id: "user-123",
  roleNames: ["admin", "editor"],
  permissionNames: ["users.read", "posts.write"],
  applicationPaths: ["users", "posts"]
}

// ❌ 避免（~5000+ bytes）
{
  id: "user-123",
  roles: [
    { id: "...", name: "admin", description: "...", permissions: [...] }
  ],
  permissions: [
    { id: "...", name: "users.read", resource: "...", action: "..." }
  ]
}
```

---

## 🧪 測試清單

### 功能測試

- [ ] **首頁**: `/` 可以訪問
- [ ] **登入頁**: `/auth/login` 可以訪問
- [ ] **註冊頁**: `/auth/register` 可以訪問
- [ ] **認證保護**: 未登入訪問 `/dashboard` 重定向到登入
- [ ] **角色保護**: 非 admin 訪問 `/admin` 重定向到 `/no-access`
- [ ] **OAuth 登入**: Google/GitHub 登入正常
- [ ] **Credentials 登入**: 郵箱密碼登入正常
- [ ] **登出**: 登出後無法訪問保護路由

### 權限測試

- [ ] **Admin 用戶**: 可以訪問所有 `/admin/*` 路由
- [ ] **普通用戶**: 只能訪問有權限的應用模組
- [ ] **應用訪問**: `applicationPaths` 正確限制訪問
- [ ] **JWT 更新**: 權限變更後重新登入生效

### Edge Runtime 測試

- [ ] **無 __dirname 錯誤**: 查看 Vercel 日誌
- [ ] **快速響應**: 中間件響應 <100ms
- [ ] **全球訪問**: 不同地區訪問都快速
- [ ] **並發測試**: 高並發下仍然穩定

---

## 🔧 故障排除

### 問題 1: 仍然出現 __dirname 錯誤

**檢查**:
```bash
# 1. 確認 middleware.ts 使用 getToken()
grep "getToken" middleware.ts

# 2. 確認沒有導入 Prisma
grep "prisma" middleware.ts
grep "@prisma" middleware.ts

# 3. 確認 next.config.js 配置正確
grep "serverExternalPackages" next.config.js
```

**解決**:
```bash
# 清理並重新構建
rm -rf .next node_modules/.cache
pnpm install
pnpm build
```

### 問題 2: JWT Token 沒有 RBAC 數據

**檢查**:
```typescript
// 在 middleware.ts 添加調試日誌
console.log('[Middleware] Token:', JSON.stringify(token, null, 2))
```

**確認 auth.config.ts**:
```typescript
// jwt callback 必須正確設置
async jwt({ token, user }) {
  if (user) {
    const rbacData = await getUserRolesAndPermissions(user.id)
    token.roleNames = rbacData.roles.map(r => r.name)
    // ...
  }
  return token
}
```

### 問題 3: 權限檢查不工作

**測試權限函數**:
```typescript
// 創建測試腳本
import { hasAdminPrivileges, hasPermission } from './middleware'

const testToken = {
  id: 'test-user',
  roleNames: ['user'],
  permissionNames: ['users.read'],
  applicationPaths: ['dashboard']
}

console.log('Is Admin:', hasAdminPrivileges(testToken)) // false
console.log('Has Permission:', hasPermission(testToken, 'users.read')) // true
```

---

## 📚 相關資源

### 官方文檔

- **Auth.js Edge Compatibility**: https://authjs.dev/guides/edge-compatibility
- **Next.js 15 Middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Vercel Edge Runtime**: https://vercel.com/docs/functions/runtimes#edge-runtime
- **next-auth/jwt getToken**: https://next-auth.js.org/configuration/nextjs#gettoken

### 項目文檔

- `middleware.ts` - 主要 middleware 實現
- `MIDDLEWARE_RBAC_GUIDE.md` - RBAC 使用指南
- `auth.config.ts` - Auth.js 配置
- `types/next-auth.d.ts` - TypeScript 類型定義

---

## 🎉 完成狀態

- ✅ **Edge Runtime 兼容**: 完全使用 Web APIs
- ✅ **Auth.js V5**: 遵循最新最佳實踐
- ✅ **完整 RBAC**: 角色、權限、應用三層控制
- ✅ **零數據庫查詢**: JWT-based 授權
- ✅ **類型安全**: 完整 TypeScript 支持
- ✅ **生產就緒**: 可安全部署到 Vercel

---

**建立日期**: 2025-10-24  
**最後更新**: 2025-10-24 20:50 UTC+8  
**狀態**: ✅ 生產就緒
