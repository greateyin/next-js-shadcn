# Middleware RBAC 使用指南

## 📋 概述

本項目使用 **Auth.js V5** 和 **JWT-based RBAC** 實現完整的權限控制系統。所有權限數據都存儲在 JWT token 中，middleware 在 Edge Runtime 中運行，無需訪問數據庫。

## 🏗️ 架構設計

### JWT Token 結構

```typescript
interface AuthJWT {
  // 基本用戶信息
  id: string                    // 用戶 ID
  email: string                 // 電子郵件
  name: string | null           // 用戶名稱
  status: AuthStatus            // 用戶狀態
  
  // RBAC 權限數據
  roleNames: string[]           // 角色名稱列表 ['admin', 'user']
  permissionNames: string[]     // 權限名稱列表 ['users.read', 'posts.write']
  applicationPaths: string[]    // 應用路徑列表 ['users', 'settings']
  
  // 向後兼容
  role: string                  // 舊版單一角色欄位
}
```

### 權限數據流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 用戶登入 (auth.config.ts)                            │
│     ↓                                                    │
│  2. JWT Callback 查詢 getUserRolesAndPermissions()       │
│     ↓                                                    │
│  3. 將角色/權限存入 JWT Token                             │
│     - roleNames: ['admin', 'editor']                    │
│     - permissionNames: ['users.read', 'posts.write']    │
│     - applicationPaths: ['users', 'posts']              │
│     ↓                                                    │
│  4. Session Callback 將數據傳遞到 Session                │
│     ↓                                                    │
│  5. Middleware 使用 getToken() 讀取 JWT (Edge Runtime)   │
│     - 無需數據庫查詢                                      │
│     - 超快速權限檢查                                      │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Middleware 權限檢查

### 1. 管理員權限檢查

```typescript
import { hasAdminPrivileges } from '@/middleware'
import { getToken } from 'next-auth/jwt'

// 在 middleware 中
const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
const isAdmin = hasAdminPrivileges(token)

if (isAdmin) {
  // 允許訪問所有管理功能
}
```

**支持的管理員角色**：
- `admin`
- `super-admin`

### 2. 特定權限檢查

```typescript
import { hasPermission } from '@/middleware'

// 檢查是否有特定權限
const canReadUsers = hasPermission(token, 'users.read')
const canWritePosts = hasPermission(token, 'posts.write')
const canDeleteComments = hasPermission(token, 'comments.delete')

if (canReadUsers) {
  // 允許讀取用戶數據
}
```

### 3. 應用程式訪問檢查

```typescript
import { hasApplicationAccess } from '@/middleware'

// 檢查是否可以訪問特定應用模組
const canAccessUsers = hasApplicationAccess(token, 'users')
const canAccessPosts = hasApplicationAccess(token, 'posts')
const canAccessSettings = hasApplicationAccess(token, 'settings')

if (canAccessUsers) {
  // 允許訪問用戶管理模組
}
```

## 🛡️ 路由保護策略

### 公開路由
```typescript
// 無需認證
- /                     // 首頁
- /auth/login          // 登入頁
- /auth/register       // 註冊頁
- /api/public/*        // 公開 API
```

### 認證路由
```typescript
// 需要登入，任何角色
- /dashboard           // 用戶儀表板
- /dashboard/*         // 儀表板子頁面
- /profile             // 個人資料
```

### 管理員路由
```typescript
// 需要 admin 或 super-admin 角色
- /admin               // 管理後台首頁
- /admin/*             // 所有管理功能
- /api/admin/*         // 管理 API
```

### 應用程式特定路由
```typescript
// 需要特定應用程式訪問權限
- /admin/users         // 需要 'users' 應用訪問權
- /admin/posts         // 需要 'posts' 應用訪問權
- /admin/settings      // 需要 'settings' 應用訪問權
```

## 📝 在其他地方使用權限檢查

### Server Components

```typescript
import { auth } from '@/auth'
import { hasAdminPrivileges, hasPermission } from '@/middleware'
import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'

export default async function AdminPage() {
  const session = await auth()
  
  // 方法 1: 從 session 檢查
  const isAdmin = session?.user?.roleNames?.includes('admin')
  
  // 方法 2: 使用 middleware 輔助函數
  const cookieStore = cookies()
  const token = await getToken({ 
    req: { headers: { cookie: cookieStore.toString() } } as any,
    secret: process.env.AUTH_SECRET 
  })
  const hasAdminAccess = hasAdminPrivileges(token)
  
  if (!hasAdminAccess) {
    redirect('/no-access')
  }
  
  return <div>Admin Content</div>
}
```

### API Routes

```typescript
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  
  // 檢查認證
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 檢查管理員權限
  const isAdmin = session.user.roleNames?.includes('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 檢查特定權限
  const canReadUsers = session.user.permissionNames?.includes('users.read')
  if (!canReadUsers) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  
  // 執行操作
  return NextResponse.json({ data: 'success' })
}
```

### Client Components

```typescript
'use client'

import { useSession } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Please sign in</div>
  }
  
  // 檢查權限
  const isAdmin = session.user.roleNames?.includes('admin')
  const canEditProfile = session.user.permissionNames?.includes('profile.edit')
  const canAccessUsers = session.user.applicationPaths?.includes('users')
  
  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      
      {isAdmin && <AdminPanel />}
      {canEditProfile && <EditButton />}
      {canAccessUsers && <UsersLink />}
    </div>
  )
}
```

## 🔧 配置文件

### auth.config.ts JWT Callback

```typescript
async jwt({ token, user, account }) {
  if (user) {
    token.id = user.id
    token.status = user.status
    
    // 🔑 關鍵：查詢並存儲 RBAC 數據
    const userRolesAndPermissions = await getUserRolesAndPermissions(user.id)
    
    token.roleNames = userRolesAndPermissions.roles.map(r => r.name)
    token.permissionNames = userRolesAndPermissions.permissions.map(p => p.name)
    token.applicationPaths = userRolesAndPermissions.applications.map(a => a.path)
    
    // 向後兼容
    token.role = userRolesAndPermissions.roles.some(r => r.name === 'admin') 
      ? 'admin' 
      : 'user'
  }
  return token
}
```

### auth.config.ts Session Callback

```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id as string
    session.user.status = token.status
    
    // 🔑 傳遞 RBAC 數據到 session
    session.user.roleNames = (token.roleNames as string[]) || []
    session.user.permissionNames = (token.permissionNames as string[]) || []
    session.user.applicationPaths = (token.applicationPaths as string[]) || []
    
    // 向後兼容
    session.user.role = token.role as string
  }
  return session
}
```

## 🚀 性能優化

### 1. JWT Token 大小優化

**✅ 好的做法**：
```typescript
// 僅存儲名稱/標識符
token.roleNames = ['admin', 'editor']
token.permissionNames = ['users.read', 'posts.write']
token.applicationPaths = ['users', 'posts']
```

**❌ 避免**：
```typescript
// 不要存儲完整對象（會導致 token 過大）
token.roles = [
  { id: '...', name: 'admin', description: '...', permissions: [...] }
]
```

### 2. Edge Runtime 優勢

- ✅ **無需數據庫查詢** - 所有權限數據在 JWT 中
- ✅ **全球分佈** - Edge 節點遍布全球
- ✅ **低延遲** - 毫秒級響應時間
- ✅ **自動擴展** - 無需管理服務器

### 3. 權限更新策略

當用戶權限改變時：

```typescript
// 1. 更新數據庫
await db.userRole.create({ userId, roleId })

// 2. 強制用戶重新登入（刷新 JWT）
await signOut({ redirect: false })
await signIn('credentials', { ... })

// 或者：設置較短的 JWT 有效期
session: {
  maxAge: 1 * 60 * 60, // 1 小時
  updateAge: 15 * 60,  // 15 分鐘更新一次
}
```

## 🧪 測試範例

### 測試管理員訪問

```typescript
describe('Admin Access', () => {
  it('should allow admin users', async () => {
    const token = {
      id: 'user-1',
      roleNames: ['admin'],
      permissionNames: [],
      applicationPaths: []
    }
    
    const hasAccess = hasAdminPrivileges(token)
    expect(hasAccess).toBe(true)
  })
  
  it('should deny regular users', async () => {
    const token = {
      id: 'user-2',
      roleNames: ['user'],
      permissionNames: [],
      applicationPaths: []
    }
    
    const hasAccess = hasAdminPrivileges(token)
    expect(hasAccess).toBe(false)
  })
})
```

## 📚 相關文件

- `middleware.ts` - Middleware 實現
- `auth.config.ts` - Auth.js 配置
- `types/next-auth.d.ts` - TypeScript 類型定義
- `lib/auth/roleService.ts` - 角色服務
- `lib/auth/admin-check.ts` - Admin 權限檢查工具

## 🔗 參考資源

- [Auth.js V5 文檔](https://authjs.dev)
- [Next.js Middleware 文檔](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime 限制](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)

---

**最後更新**: 2025-10-24 20:46 UTC+8  
**狀態**: ✅ 生產就緒
