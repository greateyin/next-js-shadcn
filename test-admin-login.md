# 🔍 Admin 登入問題診斷

## 問題描述
使用 `admin@example.com` / `Admin@123` 登入後無法到達 `/admin` dashboard

## 🎯 診斷步驟

### Step 1: 確認數據庫中用戶有 admin 角色

```sql
-- 連接數據庫
psql 'postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost?sslmode=require&channel_binding=require'

-- 檢查 admin 用戶的角色
SELECT 
    u.email,
    u.name,
    u.status,
    r.name as role_name,
    p.name as permission_name,
    a.path as application_path
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
LEFT JOIN "RoleApplication" ra ON r.id = ra."roleId"
LEFT JOIN "Application" a ON ra."applicationId" = a.id
WHERE u.email = 'admin@example.com'
ORDER BY r.name, p.name
LIMIT 50;
```

**預期結果**:
- ✅ role_name: 'admin'
- ✅ 21 個 permissions
- ✅ application_path: '/dashboard', '/admin'

### Step 2: 添加 Middleware 調試日誌

編輯 `middleware.ts`，在第 147 行後添加調試日誌：

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET,
  }) as AuthJWT | null
  
  // 🔍 添加調試日誌
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) {
    console.log('[Middleware Debug]', {
      pathname,
      hasToken: !!token,
      userId: token?.id,
      email: token?.email,
      roleNames: token?.roleNames,
      permissionNames: token?.permissionNames?.slice(0, 5), // 只顯示前 5 個
      applicationPaths: token?.applicationPaths,
      hasAdminPrivileges: hasAdminPrivileges(token),
    })
  }
  
  const isAuthenticated = !!token
  const userHasAdminPrivileges = hasAdminPrivileges(token)
  
  // ... 其餘代碼
}
```

### Step 3: 本地測試登入流程

```bash
# 1. 啟動開發服務器
pnpm dev

# 2. 打開瀏覽器 http://localhost:3000

# 3. 清除所有 cookies
# DevTools → Application → Cookies → Clear All

# 4. 訪問登入頁
# http://localhost:3000/auth/login

# 5. 使用測試帳號登入
# Email: admin@example.com
# Password: Admin@123

# 6. 查看終端日誌
# 應該看到 [Middleware Debug] 輸出

# 7. 查看瀏覽器 Network 標籤
# 看看重定向到哪裡
```

### Step 4: 檢查 JWT Token（瀏覽器 Console）

登入成功後，在瀏覽器 Console 執行：

```javascript
// 獲取當前 session
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('=== Session Debug ===');
    console.log('Email:', session.user?.email);
    console.log('Role Names:', session.user?.roleNames);
    console.log('Permission Names:', session.user?.permissionNames);
    console.log('Application Paths:', session.user?.applicationPaths);
    console.log('Legacy Role:', session.user?.role);
    console.log('Full Session:', session);
  });
```

**預期輸出**:
```json
{
  "user": {
    "email": "admin@example.com",
    "roleNames": ["admin"],
    "permissionNames": ["users:read", "users:create", ...],
    "applicationPaths": ["/dashboard", "/admin"],
    "role": "admin"
  }
}
```

### Step 5: 測試直接訪問 /admin

```javascript
// 在已登入狀態下，嘗試訪問
window.location.href = '/admin'

// 或者在新標籤打開
window.open('/admin', '_blank')
```

## 🐛 常見問題和解決方案

### 問題 1: roleNames 為空陣列 `[]`

**原因**: `getUserRolesAndPermissions` 函數失敗

**解決**:
```typescript
// 檢查 auth.config.ts 的 jwt callback
// 確保沒有 try-catch 吞掉錯誤

async jwt({ token, user, account }) {
  if (user) {
    try {
      const userRolesAndPermissions = await getUserRolesAndPermissions(user.id);
      console.log('[JWT Callback] Roles:', userRolesAndPermissions.roles.map(r => r.name));
      
      token.roleNames = userRolesAndPermissions.roles.map(r => r.name);
      // ...
    } catch (error) {
      console.error("[JWT Callback] Error:", error); // 🔍 重要：看錯誤
      throw error; // 🔍 重要：不要吞掉錯誤！
    }
  }
  return token;
}
```

### 問題 2: Credentials 登入後沒有創建 session

**檢查**: 確認 session strategy 是 JWT

```typescript
// auth.config.ts
session: {
  strategy: "jwt" as const,  // ✅ 必須是 JWT
  maxAge: 30 * 24 * 60 * 60,
  updateAge: 24 * 60 * 60,
}
```

### 問題 3: Middleware 無限重定向

**原因**: matcher 配置問題

**檢查** `middleware.ts`:
```typescript
export const config = {
  matcher: [
    // ✅ 確保排除 /api/auth
    '/((?!api/auth|_next/static|_next/image|favicon\.ico|favicon\.png).*)',
  ],
}
```

### 問題 4: admin@example.com 密碼錯誤

**重置密碼**:
```sql
-- 使用正確的 bcrypt hash
UPDATE "User"
SET password = '$2a$10$YourHashedPasswordHere'
WHERE email = 'admin@example.com';
```

**或重新執行 seed**:
```bash
npx tsx prisma/seed.ts
```

## 🔧 臨時解決方案：直接修改 middleware

如果問題持續，可以臨時禁用 admin 檢查：

```typescript
// middleware.ts 第 177-180 行
if (isAuthenticated && isAuthPage) {
  // 臨時：所有用戶都重定向到 /admin（測試用）
  const target = '/admin'; // 或 DEFAULT_LOGIN_REDIRECT
  return NextResponse.redirect(new URL(target, request.url))
}
```

## 📊 完整調試輸出範例

### 成功的日誌應該像這樣：

**Terminal (Middleware)**:
```
[Middleware Debug] {
  pathname: '/auth/login',
  hasToken: true,
  userId: 'cmh4xxxxx',
  email: 'admin@example.com',
  roleNames: ['admin'],
  permissionNames: ['users:read', 'users:create', 'users:update', 'users:delete', 'roles:read'],
  applicationPaths: ['/dashboard', '/admin'],
  hasAdminPrivileges: true
}
```

**Browser Console**:
```json
{
  "user": {
    "id": "cmh4xxxxx",
    "email": "admin@example.com",
    "name": "Admin User",
    "roleNames": ["admin"],
    "permissionNames": [...],
    "applicationPaths": ["/dashboard", "/admin"],
    "role": "admin",
    "status": "active"
  }
}
```

**Browser Network**:
```
Request URL: http://localhost:3000/auth/login
Status: 307 Temporary Redirect
Location: http://localhost:3000/admin
```

## ✅ 成功標準

登入 admin@example.com 後：
1. ✅ 瀏覽器重定向到 `/admin`
2. ✅ 看到 Admin Dashboard 頁面
3. ✅ Console 顯示 roleNames: ["admin"]
4. ✅ 可以訪問所有 admin 子路由

---

**下一步**: 請執行 Step 1-4，並將結果貼回來，我會幫您分析問題！
