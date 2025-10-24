# ✅ 部署前檢查清單

## 🔍 本地驗證（部署前必做）

### 1. 代碼檢查

```bash
# ✅ 確認 middleware 使用 getToken
grep -n "getToken" middleware.ts
# 預期: 應該看到 "import { getToken } from 'next-auth/jwt'"

# ✅ 確認沒有 Node.js globals
grep -n "__dirname\|__filename\|require(" middleware.ts
# 預期: 應該沒有任何結果

# ✅ 確認沒有 Prisma 導入
grep -n "@prisma\|prisma" middleware.ts
# 預期: 應該沒有任何結果
```

### 2. 本地構建測試

```bash
# 清理緩存
rm -rf .next

# 本地構建
pnpm build

# 檢查輸出中的 middleware
# ✅ 預期看到: ƒ Middleware
# ✅ 預期看到: (Edge Runtime)
```

### 3. TypeScript 檢查

```bash
# 確認沒有類型錯誤
pnpm tsc --noEmit

# ✅ 預期: 無錯誤
```

---

## 🚀 Vercel 部署

### Step 1: 提交代碼

```bash
git add .
git commit -m "fix: Edge Runtime compatible middleware with Auth.js V5"
git push origin main
```

### Step 2: 等待部署完成

- 打開 Vercel Dashboard
- 等待 "Building" 狀態完成
- 檢查是否有錯誤

### Step 3: 驗證部署

訪問以下 URL：

```
✅ https://your-app.vercel.app/
✅ https://your-app.vercel.app/auth/login
✅ https://your-app.vercel.app/dashboard (應重定向到登入)
✅ https://your-app.vercel.app/admin (應重定向到登入)
```

---

## 🔍 Vercel 日誌檢查

### 查看 Functions 日誌

1. Vercel Dashboard → 你的專案
2. Deployments → 最新部署
3. Functions 標籤
4. 找到 `middleware` (Edge Runtime)
5. 點擊查看日誌

### ✅ 好的日誌範例

```
[Middleware] Access denied for user abc to /admin/users
```

### ❌ 錯誤日誌（不應該出現）

```
ReferenceError: __dirname is not defined
Error: The Edge Function is referencing unsupported modules
```

---

## 🧪 功能測試清單

### 未登入狀態

- [ ] 訪問 `/` - 應該正常顯示
- [ ] 訪問 `/auth/login` - 應該正常顯示登入頁
- [ ] 訪問 `/dashboard` - 應該重定向到 `/auth/login?callbackUrl=/dashboard`
- [ ] 訪問 `/admin` - 應該重定向到 `/auth/login?callbackUrl=/admin`

### 普通用戶登入

- [ ] 登入成功後重定向到 `/dashboard`
- [ ] 可以訪問 `/dashboard/*` 路由
- [ ] 訪問 `/admin` - 應該重定向到 `/no-access`
- [ ] 訪問 `/auth/login` - 應該重定向到 `/dashboard`

### Admin 用戶登入

- [ ] 登入成功後重定向到 `/admin`
- [ ] 可以訪問所有 `/admin/*` 路由
- [ ] 可以訪問所有 `/api/admin/*` API
- [ ] 訪問 `/auth/login` - 應該重定向到 `/admin`

### 登出功能

- [ ] 登出後無法訪問 `/dashboard`
- [ ] 登出後無法訪問 `/admin`
- [ ] 登出後重定向到 `/auth/login`

---

## 📊 性能檢查

### Edge Runtime 確認

```bash
# Vercel Dashboard → Functions
# 確認 middleware 標記為 "Edge Runtime"
# ✅ 預期: Edge Runtime
# ❌ 錯誤: Node.js Runtime
```

### 響應時間檢查

使用瀏覽器開發者工具：

1. 打開 DevTools → Network
2. 訪問受保護路由
3. 查看 middleware 響應時間

```
✅ 理想: < 100ms
✅ 可接受: < 200ms
❌ 需要優化: > 500ms
```

---

## 🔐 安全檢查

### JWT Token 檢查

在瀏覽器 Console 中：

```javascript
// 登入後執行
const session = await fetch('/api/auth/session').then(r => r.json())
console.log('Session:', session)

// ✅ 應該包含:
// - user.roleNames: ['admin'] 或 ['user']
// - user.permissionNames: ['users.read', ...]
// - user.applicationPaths: ['users', 'posts', ...]
```

### Cookie 安全性

檢查 DevTools → Application → Cookies：

```
✅ authjs.session-token 或 __Secure-authjs.session-token
✅ HttpOnly: true
✅ Secure: true (生產環境)
✅ SameSite: Lax
```

---

## 🐛 問題排查

### 問題 1: 500 錯誤

**檢查 Vercel 日誌**:
```
Vercel Dashboard → Deployments → 最新部署 → Functions → middleware
```

**常見原因**:
- [ ] 環境變數 `AUTH_SECRET` 未設置
- [ ] JWT token 格式錯誤
- [ ] middleware 導入了不支持的模組

### 問題 2: 無限重定向

**檢查**:
```typescript
// middleware.ts
// 確認 matcher 正確排除 /api/auth
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\.ico|favicon\.png).*)',
  ],
}
```

### 問題 3: 權限不生效

**檢查 JWT**:
```typescript
// 在 middleware.ts 添加臨時日誌
console.log('[DEBUG] Token:', JSON.stringify(token, null, 2))
```

**確認 auth.config.ts**:
```typescript
// jwt callback 必須包含
async jwt({ token, user }) {
  if (user) {
    const rbacData = await getUserRolesAndPermissions(user.id)
    token.roleNames = rbacData.roles.map(r => r.name)
    token.permissionNames = rbacData.permissions.map(p => p.name)
    token.applicationPaths = rbacData.applications.map(a => a.path)
  }
  return token
}
```

---

## ✅ 完成確認

當所有以下項目都打勾，表示部署成功：

### 代碼檢查
- [ ] middleware.ts 使用 `getToken()`
- [ ] 沒有 Node.js globals (`__dirname`, `fs`)
- [ ] 沒有導入 Prisma
- [ ] TypeScript 無錯誤

### 本地測試
- [ ] `pnpm build` 成功
- [ ] 看到 "Edge Runtime" 標記
- [ ] 無構建錯誤

### Vercel 部署
- [ ] 部署狀態 "Ready"
- [ ] Functions 顯示 middleware (Edge Runtime)
- [ ] 無 500 錯誤

### 功能測試
- [ ] 未登入用戶正確重定向
- [ ] 登入功能正常
- [ ] Admin 路由保護正常
- [ ] 普通用戶權限限制正常
- [ ] 登出功能正常

### 性能檢查
- [ ] Middleware 響應 < 200ms
- [ ] 無數據庫查詢延遲
- [ ] Edge Runtime 全球分佈

---

## 🎉 部署成功！

如果所有項目都完成，恭喜！你的應用已經：

- ✅ **完全 Edge Runtime 兼容**
- ✅ **使用 Auth.js V5 最佳實踐**
- ✅ **完整 RBAC 權限控制**
- ✅ **生產環境就緒**
- ✅ **全球低延遲訪問**

---

**需要幫助？**

參考文檔：
- `VERCEL_EDGE_RUNTIME_DEPLOYMENT.md` - 完整部署指南
- `MIDDLEWARE_RBAC_GUIDE.md` - RBAC 使用指南
- `middleware.ts` - 源代碼

Vercel 支持：https://vercel.com/support
