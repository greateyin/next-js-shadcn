# MenuItem 與 Role 關聯實作文檔

## 📅 完成日期：2025-10-04

---

## 🎯 設計目標

透過 **Role** 與 **MenuItem** 之間的關聯，再結合 **User** 與 **Role** 的關係，使用**關係的聯集後的 DISTINCT 集**來決定單一使用者可以使用的選單群。

---

## 📊 資料庫結構

### 關聯鏈

```
User → UserRole → Role → MenuItemRole → MenuItem
```

### 實體關係圖（ER Diagram）

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│   User   │────────>│   UserRole   │────────>│   Role   │
└──────────┘         └──────────────┘         └──────────┘
                                                     │
                                                     │
                                                     ↓
                                            ┌────────────────┐
                                            │ MenuItemRole   │
                                            └────────────────┘
                                                     │
                                                     │
                                                     ↓
                                              ┌──────────┐
                                              │ MenuItem │
                                              └──────────┘
```

### 新增的 MenuItemRole 表

```prisma
model MenuItemRole {
  id         String   @id @default(cuid())
  menuItemId String   // 選單項目 ID
  roleId     String   // 角色 ID
  canView    Boolean  @default(true)   // 可查看（顯示在選單）
  canAccess  Boolean  @default(true)   // 可存取（可點擊進入）
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  menuItem   MenuItem @relation(...)
  role       Role     @relation(...)
  
  @@unique([menuItemId, roleId])
  @@index([menuItemId])
  @@index([roleId])
  @@index([roleId, canView])
  @@index([menuItemId, canView])
}
```

---

## 🔍 查詢邏輯說明

### 核心查詢邏輯

```typescript
async function getUserMenuItems(userId: string) {
  // 1. 取得用戶的所有角色（透過 UserRole）
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });
  
  const roleIds = userRoles.map(ur => ur.roleId);
  
  // 2. 取得選單項目（透過 MenuItemRole）
  const menuItems = await db.menuItem.findMany({
    where: {
      isVisible: true,
      isDisabled: false,
      OR: [
        // 情況 A：沒有設定角色權限（公開選單）
        { roleAccess: { none: {} } },
        
        // 情況 B：用戶的角色有權限（DISTINCT 聯集）
        {
          roleAccess: {
            some: {
              roleId: { in: roleIds },  // ← 關鍵：聯集查詢
              canView: true
            }
          }
        }
      ]
    },
    orderBy: { order: 'asc' }
  });
  
  return menuItems;
}
```

### DISTINCT 聯集說明

**範例場景**：

```
用戶：John
角色：[user, moderator]

MenuItem A:
  - 沒有 MenuItemRole 記錄 → 所有人可見 ✅

MenuItem B:
  - MenuItemRole(roleId=admin, canView=true)
  - John 沒有 admin 角色 → 不可見 ❌

MenuItem C:
  - MenuItemRole(roleId=user, canView=true)
  - MenuItemRole(roleId=moderator, canView=true)
  - John 有 user 或 moderator → 可見 ✅（聯集）

MenuItem D:
  - MenuItemRole(roleId=user, canView=false)
  - 即使 John 有 user 角色，canView=false → 不可見 ❌
```

**SQL 概念**（參考）：

```sql
SELECT DISTINCT m.*
FROM "MenuItem" m
LEFT JOIN "MenuItemRole" mir ON m.id = mir."menuItemId"
WHERE m."isVisible" = true
  AND m."isDisabled" = false
  AND (
    -- 沒有角色限制
    NOT EXISTS (
      SELECT 1 FROM "MenuItemRole" 
      WHERE "menuItemId" = m.id
    )
    OR
    -- 或者用戶角色在允許清單中
    mir."roleId" IN (
      SELECT "roleId" FROM "UserRole" 
      WHERE "userId" = :userId
    )
    AND mir."canView" = true
  )
ORDER BY m."order" ASC;
```

---

## 📝 使用範例

### 範例 1：取得用戶的選單項目

```typescript
import { getUserMenuItems } from "@/lib/menu";

// 在 Server Component 中
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  // 取得用戶可見的選單（基於角色）
  const menuItems = await getUserMenuItems(session.user.id);
  
  return (
    <DashboardShell menuItems={menuItems}>
      {/* ... */}
    </DashboardShell>
  );
}
```

### 範例 2：檢查用戶是否可存取特定選單

```typescript
import { canUserAccessMenuItem } from "@/lib/menu";

// 權限檢查
const canAccess = await canUserAccessMenuItem(userId, menuItemId);

if (!canAccess) {
  return <div>您沒有權限存取此頁面</div>;
}
```

### 範例 3：取得特定角色的選單

```typescript
import { getMenuItemsByRole } from "@/lib/menu";

// 管理介面：查看某個角色可以看到哪些選單
const adminMenuItems = await getMenuItemsByRole("admin-role-id");
```

---

## 🗂️ 資料庫範例資料

### 建立選單項目與角色權限

```typescript
// 1. 建立應用程式
const dashboardApp = await db.application.create({
  data: {
    name: "dashboard",
    displayName: "Dashboard",
    path: "/dashboard",
    isActive: true,
    order: 0,
  },
});

// 2. 建立選單項目
const dashboardMenuItem = await db.menuItem.create({
  data: {
    name: "dashboard",
    displayName: "Dashboard",
    path: "/dashboard",
    icon: "LayoutDashboard",
    type: "LINK",
    applicationId: dashboardApp.id,
    order: 0,
    isVisible: true,
  },
});

const profileMenuItem = await db.menuItem.create({
  data: {
    name: "profile",
    displayName: "Profile",
    description: "個人資料",
    path: "/dashboard/profile",
    icon: "UserCircle",
    type: "LINK",
    applicationId: dashboardApp.id,
    order: 1,
    isVisible: true,
  },
});

const usersMenuItem = await db.menuItem.create({
  data: {
    name: "users",
    displayName: "Users",
    description: "用戶管理",
    path: "/dashboard/users",
    icon: "Users",
    type: "LINK",
    applicationId: dashboardApp.id,
    order: 2,
    isVisible: true,
  },
});

const settingsMenuItem = await db.menuItem.create({
  data: {
    name: "settings",
    displayName: "Settings",
    path: "/dashboard/settings",
    icon: "Settings",
    type: "LINK",
    applicationId: dashboardApp.id,
    order: 3,
    isVisible: true,
  },
});

// 3. 建立角色
const userRole = await db.role.findUnique({
  where: { name: "user" },
});

const adminRole = await db.role.findUnique({
  where: { name: "admin" },
});

// 4. 設定權限（users 選單只有 admin 可見）
await db.menuItemRole.create({
  data: {
    menuItemId: usersMenuItem.id,
    roleId: adminRole!.id,
    canView: true,
    canAccess: true,
  },
});

// Dashboard, Profile, Settings 沒有設定權限 → 所有人可見
```

---

## 🎯 權限策略

### 策略 A：預設公開（推薦）

```
沒有 MenuItemRole 記錄 = 所有人可見
有 MenuItemRole 記錄 = 僅指定角色可見
```

**優點**：
- ✅ 簡單直觀
- ✅ 新增選單自動對所有人可見
- ✅ 適合大多數場景

**範例**：
```
Dashboard  → 無權限設定 → 所有人可見
Profile    → 無權限設定 → 所有人可見
Users      → [admin]    → 僅 admin 可見
Settings   → 無權限設定 → 所有人可見
```

### 策略 B：預設私有

```
沒有 MenuItemRole 記錄 = 沒人可見（需要明確授權）
有 MenuItemRole 記錄 = 指定角色可見
```

**優點**：
- ✅ 更安全
- ✅ 明確授權

**缺點**：
- ❌ 需要為每個選單設定權限
- ❌ 管理成本高

**實作方式**（修改查詢邏輯）：
```typescript
// 移除 "沒有權限設定" 的 OR 條件
where: {
  isVisible: true,
  roleAccess: {
    some: {
      roleId: { in: roleIds },
      canView: true
    }
  }
}
```

**推薦**：使用策略 A（預設公開）

---

## 📋 Migration 步驟

### 1. 生成 Migration

```bash
# 生成 migration 檔案
pnpm prisma migrate dev --name add_menu_item_role

# 或
npx prisma migrate dev --name add_menu_item_role
```

### 2. 查看 Migration SQL

Migration 會自動生成以下 SQL：

```sql
-- CreateEnum
CREATE TYPE "MenuItemType" AS ENUM ('LINK', 'GROUP', 'DIVIDER', 'EXTERNAL');

-- AlterTable MenuItem
ALTER TABLE "MenuItem" 
  ADD COLUMN "description" TEXT,
  ADD COLUMN "type" "MenuItemType" NOT NULL DEFAULT 'LINK',
  ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable MenuItemRole
CREATE TABLE "MenuItemRole" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemRole_menuItemId_roleId_key" 
  ON "MenuItemRole"("menuItemId", "roleId");

CREATE INDEX "MenuItemRole_menuItemId_idx" 
  ON "MenuItemRole"("menuItemId");

CREATE INDEX "MenuItemRole_roleId_idx" 
  ON "MenuItemRole"("roleId");

CREATE INDEX "MenuItemRole_roleId_canView_idx" 
  ON "MenuItemRole"("roleId", "canView");

CREATE INDEX "MenuItemRole_menuItemId_canView_idx" 
  ON "MenuItemRole"("menuItemId", "canView");

-- AddForeignKey
ALTER TABLE "MenuItemRole" 
  ADD CONSTRAINT "MenuItemRole_menuItemId_fkey" 
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuItemRole" 
  ADD CONSTRAINT "MenuItemRole_roleId_fkey" 
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
```

### 3. 套用 Migration

```bash
# 套用到資料庫
pnpm prisma migrate deploy

# 生成 Prisma Client
pnpm prisma generate
```

---

## 🧪 測試範例

### 測試場景 1：不同角色看到不同選單

```typescript
// 假設：
// - user 角色：看到 Dashboard, Profile, Settings
// - admin 角色：看到 Dashboard, Profile, Users, Settings

// 測試 user
const userMenuItems = await getUserMenuItems(userId);
console.log(userMenuItems.map(m => m.name));
// 輸出: ['dashboard', 'profile', 'settings']

// 測試 admin  
const adminMenuItems = await getUserMenuItems(adminUserId);
console.log(adminMenuItems.map(m => m.name));
// 輸出: ['dashboard', 'profile', 'users', 'settings']
```

### 測試場景 2：用戶擁有多個角色

```typescript
// John 同時是 user 和 moderator
// user 可見：[dashboard, profile]
// moderator 可見：[dashboard, reports]
// 
// 聯集結果：[dashboard, profile, reports] ← DISTINCT

const johnMenuItems = await getUserMenuItems(johnId);
// 會返回所有他擁有任一角色可見的選單（自動 DISTINCT）
```

---

## 📊 效能考量

### 索引設計

```prisma
@@index([roleId, canView])         // 查詢角色可見選單
@@index([menuItemId, canView])     // 查詢選單可見角色
@@index([menuItemId])              // FK 索引
@@index([roleId])                  // FK 索引
```

### 查詢效能

**一般場景**（用戶有 1-3 個角色）：
- ✅ `roleId IN (...)` 查詢效率高
- ✅ 索引支援良好
- ✅ 預期 < 10ms

**極端場景**（用戶有 50+ 個角色）：
- ⚠️ IN 查詢可能變慢
- 💡 考慮快取機制

### 快取建議

```typescript
// 使用 React Cache (Next.js 15)
import { cache } from 'react';

export const getUserMenuItems = cache(async (userId: string) => {
  // ... 查詢邏輯
});

// 或使用 Redis
import { redis } from '@/lib/redis';

const cacheKey = `menu:user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const menuItems = await getUserMenuItems(userId);
await redis.set(cacheKey, JSON.stringify(menuItems), 'EX', 300); // 5分鐘
```

---

## 🎯 總結

### ✅ 實現的功能

1. **User → Role → MenuItem 關聯**
2. **DISTINCT 聯集查詢**
3. **細粒度權限控制**
4. **階層式選單支援**
5. **效能優化索引**

### 📚 交付檔案

1. ✅ `prisma/schema.prisma` - 更新的資料庫 Schema
2. ✅ `lib/menu.ts` - 選單查詢函數
3. ✅ `document/MENU_ROLE_IMPLEMENTATION.md` - 本文檔

### 🚀 下一步

1. 執行 `pnpm prisma migrate dev`
2. 更新 Dashboard Sidebar 使用動態選單
3. 建立選單管理介面（可選）
4. 建立 Seed 腳本初始化資料

---

**實作完成！準備好執行 Migration 了嗎？** 🎉
