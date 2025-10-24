# 🔧 修復用戶無法訪問 Dashboard 問題

## 🎯 問題診斷

### 根本原因
用戶登入成功，但**數據庫中沒有分配角色**，導致：
1. JWT token 的 `roleNames` 為空陣列 `[]`
2. Middleware 無法正確判斷用戶權限
3. 可能觸發無限重定向或訪問被拒

---

## 📋 診斷步驟

### Step 1: 連接數據庫

```bash
psql 'postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost?sslmode=require&channel_binding=require'
```

### Step 2: 檢查用戶是否有角色

```sql
-- 查看所有用戶及其角色
SELECT 
    u.email,
    u.name,
    u.status,
    r.name as role_name,
    ur."createdAt" as role_assigned_at
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
ORDER BY u."createdAt" DESC
LIMIT 20;
```

**預期結果**:
- ✅ 每個用戶應該有至少一個角色
- ❌ 如果 `role_name` 為 NULL，表示用戶沒有角色

### Step 3: 找出沒有角色的用戶

```sql
-- 列出所有沒有角色的用戶
SELECT 
    u.id,
    u.email,
    u.name,
    u.status,
    COUNT(ur.id) as role_count
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
GROUP BY u.id, u.email, u.name, u.status
HAVING COUNT(ur.id) = 0;
```

**如果有結果** = 這些用戶需要分配角色！

---

## 🔨 修復方案

### 方案 A: 為單個用戶添加角色（推薦用於測試）

```sql
-- 1. 查找您的用戶 ID
SELECT id, email, name, status FROM "User" WHERE email = 'YOUR_EMAIL@example.com';

-- 2. 查找 'user' 角色 ID
SELECT id, name FROM "Role" WHERE name = 'user';

-- 3. 為用戶添加 'user' 角色
INSERT INTO "UserRole" ("userId", "roleId", "createdAt", "updatedAt")
VALUES (
    'YOUR_USER_ID_HERE',  -- 替換為步驟 1 的用戶 ID
    (SELECT id FROM "Role" WHERE name = 'user'),
    NOW(),
    NOW()
);

-- 4. 驗證
SELECT 
    u.email,
    r.name as role_name
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'YOUR_EMAIL@example.com';
```

### 方案 B: 批量修復（為所有活躍用戶添加 'user' 角色）

```sql
-- ⚠️ 執行前請確認！這會為所有沒有角色的活躍用戶添加 'user' 角色

-- 1. 確保 'user' 角色存在
INSERT INTO "Role" (id, name, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'user',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- 2. 為所有沒有角色的活躍用戶添加 'user' 角色
INSERT INTO "UserRole" ("userId", "roleId", "createdAt", "updatedAt")
SELECT 
    u.id,
    (SELECT id FROM "Role" WHERE name = 'user'),
    NOW(),
    NOW()
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
WHERE ur.id IS NULL
  AND u.status = 'active'
ON CONFLICT DO NOTHING;

-- 3. 驗證結果
SELECT 
    u.email,
    u.status,
    r.name as role_name
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.status = 'active'
ORDER BY u.email;
```

---

## 🔍 檢查系統角色

### 確認系統中有哪些角色

```sql
SELECT id, name, "createdAt" FROM "Role" ORDER BY name;
```

**應該至少有**:
- ✅ `user` - 普通用戶
- ✅ `admin` - 管理員（可選）

### 如果缺少角色，創建它們

```sql
-- 創建基本角色
INSERT INTO "Role" (id, name, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'user', NOW(), NOW()),
    (gen_random_uuid(), 'admin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
```

---

## 🎯 為什麼會發生這個問題？

### OAuth 登入（Google/GitHub）

查看 `auth.config.ts` 的 `signIn` callback：

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider !== "credentials") {
    const existingUser = await db.user.findUnique({
      where: { email: user.email! },
      include: { userRoles: true }
    });

    // 🔴 問題：如果用戶剛創建，userRoles.length === 0
    if (existingUser && existingUser.userRoles.length === 0) {
      // 這裡應該分配默認角色！
      const userRole = await db.role.findUnique({
        where: { name: "user" }
      });

      if (userRole) {
        await db.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: userRole.id
          }
        });
      }
    }
  }
  return true;
}
```

**這段代碼存在，但可能**:
1. 'user' 角色不存在於數據庫中
2. signIn callback 執行失敗（無錯誤提示）
3. Prisma Adapter 創建用戶時沒有同時創建角色

### Credentials 登入（郵箱密碼）

```typescript
authorize: async (credentials) => {
  // ... 驗證邏輯 ...
  
  // 🔴 問題：創建用戶後沒有分配角色
  const safeUser = {
    id: user.id,
    email: user.email,
    role: 'user',  // ❌ 這只是 JWT 欄位，不會寫入數據庫！
    // ...
  };
  
  return safeUser;
}
```

---

## ✅ 永久修復方案

### 修改 `auth.config.ts`

確保 OAuth 和 Credentials 登入都會分配默認角色：

#### 1. OAuth signIn Callback（已存在但需確保執行）

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider !== "credentials") {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        include: { userRoles: true }
      });

      if (existingUser && existingUser.userRoles.length === 0) {
        // 確保 'user' 角色存在
        let userRole = await db.role.findUnique({
          where: { name: "user" }
        });

        // 如果不存在，創建它
        if (!userRole) {
          userRole = await db.role.create({
            data: { name: "user" }
          });
        }

        // 分配角色
        await db.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: userRole.id
          }
        });
        
        console.log(`✅ Assigned 'user' role to ${existingUser.email}`);
      }
    } catch (error) {
      console.error("Error in OAuth signIn callback:", error);
      // 繼續登入流程
    }
  }
  
  return true;
}
```

#### 2. 添加 Prisma Middleware（推薦）

創建 `lib/prisma-middleware.ts`:

```typescript
import { db } from './db';

// 自動為新用戶分配默認角色
db.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'create') {
    const result = await next(params);
    
    // 為新用戶分配 'user' 角色
    try {
      let userRole = await db.role.findUnique({
        where: { name: 'user' }
      });

      if (!userRole) {
        userRole = await db.role.create({
          data: { name: 'user' }
        });
      }

      await db.userRole.create({
        data: {
          userId: result.id,
          roleId: userRole.id
        }
      });

      console.log(`✅ Auto-assigned 'user' role to new user: ${result.email}`);
    } catch (error) {
      console.error('Failed to assign default role:', error);
    }

    return result;
  }

  return next(params);
});
```

然後在 `lib/db.ts` 中導入：

```typescript
import './prisma-middleware';
```

---

## 🧪 驗證修復

### 1. 檢查數據庫

```sql
-- 所有用戶都應該有角色
SELECT 
    u.email,
    u.status,
    COUNT(ur.id) as role_count,
    STRING_AGG(r.name, ', ') as roles
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.status = 'active'
GROUP BY u.id, u.email, u.status
ORDER BY u.email;
```

### 2. 測試登入

1. 清除瀏覽器 cookies
2. 重新登入
3. 檢查是否成功重定向到 `/dashboard`

### 3. 檢查 JWT Token（瀏覽器 Console）

```javascript
// 在已登入狀態下
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('Session:', session);
    console.log('Roles:', session.user?.roleNames);
    console.log('Permissions:', session.user?.permissionNames);
  });
```

**預期結果**:
```json
{
  "user": {
    "email": "user@example.com",
    "roleNames": ["user"],
    "permissionNames": [...],
    "applicationPaths": [...]
  }
}
```

---

## 📚 相關文件

- `auth.config.ts` - 認證配置
- `lib/auth/roleService.ts` - 角色服務
- `middleware.ts` - 路由保護
- `prisma/schema.prisma` - 數據庫模型

---

## 🆘 如果仍然失敗

### 檢查 Middleware 日誌

1. 打開 `middleware.ts`
2. 添加臨時調試日誌：

```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET,
  }) as AuthJWT | null
  
  // 🔍 調試日誌
  console.log('[Middleware Debug]', {
    pathname: request.nextUrl.pathname,
    hasToken: !!token,
    tokenId: token?.id,
    roleNames: token?.roleNames,
    permissionNames: token?.permissionNames,
  });
  
  // ... 其餘邏輯
}
```

3. 重新部署
4. 查看 Vercel Logs

---

**建立日期**: 2025-10-24  
**狀態**: 🔧 診斷和修復指南  
**優先級**: 🔴 高 - 影響用戶登入體驗
