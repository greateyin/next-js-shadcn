# 🚀 Menu-Role 關聯快速啟動指南

## ✅ 已完成的變更

### 1. Schema 更新

**新增表**：
- ✅ `MenuItemRole` - 選單與角色的關聯表
- ✅ `MenuItemType` enum - 選單類型

**更新表**：
- ✅ `MenuItem` - 新增 description, type, isDisabled 欄位
- ✅ `Role` - 新增 menuItems 關聯

### 2. 程式碼新增

**新增檔案**：
- ✅ `lib/menu.ts` - 選單查詢函數庫
- ✅ `document/MENU_ROLE_IMPLEMENTATION.md` - 完整文檔

---

## 🎯 關聯邏輯

```
User → UserRole → Role → MenuItemRole → MenuItem
                           ↓
                      DISTINCT 聯集
```

**查詢邏輯**：
1. 取得用戶的所有角色
2. 透過角色查詢可見的選單項目
3. 自動 DISTINCT 去重
4. 返回用戶可見的選單群

---

## 📋 執行步驟

### 步驟 1：執行 Seed 腳本

```bash
# 執行整合的 Seed 腳本（包含所有初始化）
npx tsx prisma/seed.ts
```

**注意**：Seed 腳本已整合，包含：
- 角色、權限、應用程式
- 選單項目與權限
- 測試用戶

**這會做什麼？**
- 創建 `MenuItemRole` 表
- 為 `MenuItem` 添加新欄位
- 創建 `MenuItemType` enum
- 建立所有必要的索引和外鍵

### 步驟 2：生成 Prisma Client

```bash
pnpm prisma generate
```

### 步驟 3：測試查詢函數

```typescript
import { getUserMenuItems } from "@/lib/menu";

// 測試
const menuItems = await getUserMenuItems("user-id-here");
console.log(menuItems);
```

---

## 📝 使用範例

### 範例 1：在 Server Component 使用

```typescript
// app/dashboard/page.tsx
import { auth } from "@/auth";
import { getUserMenuItems } from "@/lib/menu";

export default async function DashboardPage() {
  const session = await auth();
  
  // 取得用戶可見的選單（基於角色）
  const menuItems = await getUserMenuItems(session.user.id);
  
  return <DashboardShell menuItems={menuItems} />;
}
```

### 範例 2：查詢函數說明

```typescript
// 取得用戶的選單項目（基於角色）
const menuItems = await getUserMenuItems(userId);

// 取得特定應用程式的選單
const appMenuItems = await getUserMenuItems(userId, applicationId);

// 檢查用戶是否可存取特定選單
const canAccess = await canUserAccessMenuItem(userId, menuItemId);

// 取得特定角色的選單
const roleMenuItems = await getMenuItemsByRole(roleId);
```

---

## 🗂️ 初始化資料範例

### 建立選單與權限

```typescript
// 1. 找到應用程式
const dashboardApp = await db.application.findFirst({
  where: { name: "dashboard" }
});

// 2. 建立選單項目
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
  }
});

// 3. 設定權限（只有 admin 可見）
const adminRole = await db.role.findUnique({
  where: { name: "admin" }
});

await db.menuItemRole.create({
  data: {
    menuItemId: usersMenuItem.id,
    roleId: adminRole.id,
    canView: true,
    canAccess: true,
  }
});

// ✅ 現在只有 admin 角色的用戶可以看到 Users 選單
```

---

## 🎯 權限邏輯

### 預設策略（推薦）

```
沒有 MenuItemRole 記錄 = 所有人可見 ✅
有 MenuItemRole 記錄 = 僅指定角色可見 ✅
```

**範例**：

| 選單 | MenuItemRole | 結果 |
|------|--------------|------|
| Dashboard | 無 | 所有人可見 ✅ |
| Profile | 無 | 所有人可見 ✅ |
| Users | admin | 僅 admin 可見 ✅ |
| Settings | 無 | 所有人可見 ✅ |

### DISTINCT 聯集範例

**用戶有多個角色**：
```
John 的角色：[user, moderator]

MenuItem A:
  - MenuItemRole(user, canView=true) ✅
  → John 可見（透過 user 角色）

MenuItem B:
  - MenuItemRole(moderator, canView=true) ✅
  → John 可見（透過 moderator 角色）

MenuItem C:
  - MenuItemRole(user, canView=true)
  - MenuItemRole(moderator, canView=true) ✅
  → John 可見（透過任一角色，DISTINCT 自動去重）

MenuItem D:
  - MenuItemRole(admin, canView=true) ❌
  → John 不可見（沒有 admin 角色）
```

---

## 📊 可用的查詢函數

### `getUserMenuItems(userId, applicationId?)`
**用途**：取得用戶可見的選單項目  
**返回**：階層式選單樹  
**邏輯**：基於用戶角色的聯集（DISTINCT）

### `canUserAccessMenuItem(userId, menuItemId)`
**用途**：檢查用戶是否可存取特定選單  
**返回**：Boolean  
**用途場景**：權限驗證

### `getMenuItemsByRole(roleId, applicationId?)`
**用途**：取得特定角色可見的選單  
**返回**：選單項目列表  
**用途場景**：管理介面預覽

### `getAllMenuItems(applicationId)`
**用途**：取得應用程式的所有選單（管理用）  
**返回**：完整選單列表  
**用途場景**：選單管理介面

### `getPublicMenuItems(applicationId?)`
**用途**：取得公開選單（無角色限制）  
**返回**：公開選單列表  
**用途場景**：未登入用戶

---

## 🔍 資料庫查詢概念

### SQL 概念（參考）

```sql
-- 取得用戶可見的選單（DISTINCT 聯集）
SELECT DISTINCT m.*
FROM "MenuItem" m
LEFT JOIN "MenuItemRole" mir ON m.id = mir."menuItemId"
WHERE m."isVisible" = true
  AND (
    -- 沒有角色限制（公開）
    NOT EXISTS (
      SELECT 1 FROM "MenuItemRole" 
      WHERE "menuItemId" = m.id
    )
    OR
    -- 或用戶角色有權限（聯集）
    (mir."roleId" IN (
      SELECT "roleId" FROM "UserRole" 
      WHERE "userId" = ?
    ) AND mir."canView" = true)
  )
ORDER BY m."order" ASC;
```

---

## ✅ 檢查清單

執行前確認：

- [ ] Prisma schema 已更新
- [ ] 準備執行 migration
- [ ] 了解查詢函數用法
- [ ] 準備初始化資料

執行後確認：

- [ ] Migration 成功
- [ ] Prisma Client 已生成
- [ ] 查詢函數可正常使用
- [ ] 資料正確初始化

---

## 📚 相關文檔

**詳細文檔**：
- `document/MENU_ROLE_IMPLEMENTATION.md` - 完整實作說明
- `document/MENU_SCHEMA_ANALYSIS.md` - Schema 設計分析
- `lib/menu.ts` - 查詢函數原始碼（含註解）

**快速參考**：
- 本文檔 - 快速啟動指南

---

## 🚀 準備好了嗎？

**執行 Migration**：
```bash
pnpm prisma migrate dev --name add_menu_item_role
```

**之後您可以**：
1. 初始化選單資料
2. 設定權限
3. 更新 Dashboard 使用動態選單
4. 享受靈活的選單權限控制！

---

**有任何問題隨時詢問！** 🎉
