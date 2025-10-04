# 🎉 Seed 腳本整合完成

## 📅 完成日期：2025-10-04

---

## ✅ 整合內容

已成功將 `prisma/seed-menu.ts` 整合到 `prisma/seed.ts` 中，並新增測試用戶。

---

## 📊 整合後的 Seed 結構

### 完整的 10 個步驟

```
🌱 Database Seed

Step 1: 📋 創建角色 (3個)
   ├─ admin
   ├─ user
   └─ moderator

Step 2: 🔐 創建權限 (21個)
   └─ users:*, roles:*, applications:*, menu:*, system:*, admin:*

Step 3: 🔗 分配權限給角色
   ├─ Admin: 21 permissions (全部)
   ├─ User: 基本查看權限
   └─ Moderator: users:* + menu:* 權限

Step 4: 📱 創建應用程式 (2個)
   ├─ dashboard (/dashboard)
   └─ admin (/admin)

Step 5: 🔗 分配應用程式給角色
   ├─ Admin → dashboard + admin
   ├─ User → dashboard
   └─ Moderator → dashboard

Step 6: 🗂️  創建選單項目 (4個)
   ├─ Dashboard (/dashboard)
   ├─ Profile (/dashboard/profile)
   ├─ Users (/dashboard/users)
   └─ Settings (/dashboard/settings)

Step 7: 🔐 設定選單權限
   ├─ Users 選單: admin + moderator 限定
   └─ 其他選單: 公開（無限制）

Step 8: 👥 創建測試用戶 (4個)
   ├─ admin@example.com
   ├─ user@example.com
   ├─ moderator@example.com
   └─ test@example.com

Step 9: 🔗 分配角色給用戶
Step 10: 🔑 創建登入方法
```

---

## 👥 測試帳號

| Email | Password | Role | 說明 |
|-------|----------|------|------|
| **admin@example.com** | Admin@123 | Admin | 完整管理員權限 |
| **user@example.com** | User@123 | User | 一般用戶 |
| **moderator@example.com** | Moderator@123 | Moderator | 審核員 |
| **test@example.com** | Test@123 | User | 測試用戶 |

---

## 🔐 權限與選單對應

### Admin 帳號
```
✅ 可存取應用程式: Dashboard, Admin
✅ 可見選單: Dashboard, Profile, Users, Settings
✅ 權限: 全部 21 個權限
```

### User 帳號
```
✅ 可存取應用程式: Dashboard
✅ 可見選單: Dashboard, Profile, Settings
❌ 不可見: Users
✅ 權限: 基本查看權限
```

### Moderator 帳號
```
✅ 可存取應用程式: Dashboard
✅ 可見選單: Dashboard, Profile, Users, Settings
✅ 權限: users:* + menu:* 權限
```

### Test 帳號
```
✅ 可存取應用程式: Dashboard
✅ 可見選單: Dashboard, Profile, Settings
❌ 不可見: Users
✅ 權限: 基本查看權限
```

---

## 🗂️ 選單權限邏輯

### 公開選單（所有人可見）
- ✅ Dashboard
- ✅ Profile
- ✅ Settings

### 限制選單（Admin & Moderator）
- 🔒 Users

**邏輯**：
```
無 MenuItemRole 記錄 = 所有人可見
有 MenuItemRole 記錄 = 僅指定角色可見
```

---

## 📋 資料關聯圖

```
User
 ├─→ UserRole → Role
 │              ├─→ RolePermission → Permission
 │              ├─→ RoleApplication → Application
 │              └─→ MenuItemRole → MenuItem
 └─→ LoginMethod

Application
 └─→ MenuItem
      └─→ MenuItemRole → Role

完整查詢鏈：
User → UserRole → Role → MenuItemRole → MenuItem
                           ↓
                   DISTINCT 聯集查詢
```

---

## 🚀 執行 Seed

### 指令

```bash
# 執行整合後的 Seed 腳本
npx tsx prisma/seed.ts
```

### 預期輸出

```
🌱 Starting database seed...
==================================================

📋 Step 1: Creating default roles...
   ✅ Created roles: admin, user, moderator

🔐 Step 2: Creating permissions...
   ✅ Created 21 permissions

🔗 Step 3: Assigning permissions to roles...
   ✅ Admin: 21 permissions
   ✅ User: 6 permissions
   ✅ Moderator: 8 permissions

📱 Step 4: Creating default applications...
   ✅ Created applications: dashboard, admin

🔗 Step 5: Assigning applications to roles...
   ✅ Assigned applications to roles

🗂️  Step 6: Creating menu items...
   ✅ Created 4 menu items

🔐 Step 7: Assigning menu item permissions...
   ✅ Users menu: restricted to admin & moderator
   ✅ Other menus: public (no restrictions)

👥 Step 8: Creating test users...
   ✅ Admin: admin@example.com (password: Admin@123)
   ✅ User: user@example.com (password: User@123)
   ✅ Moderator: moderator@example.com (password: Moderator@123)
   ✅ Test: test@example.com (password: Test@123)

🔗 Step 9: Assigning roles to users...
   ✅ Roles assigned to all users

🔑 Step 10: Creating login methods...
   ✅ Login methods created for all users

==================================================
✨ Database seed completed successfully!

📋 Test Accounts Summary:
┌─────────────────────────────────────────────────┐
│ Email                    │ Password      │ Role │
├─────────────────────────────────────────────────┤
│ admin@example.com        │ Admin@123     │ Admin│
│ user@example.com         │ User@123      │ User │
│ moderator@example.com    │ Moderator@123 │ Mod  │
│ test@example.com         │ Test@123      │ User │
└─────────────────────────────────────────────────┘

📌 Menu Permissions:
   • Dashboard, Profile, Settings: All users
   • Users: Admin & Moderator only
```

---

## 🧪 測試場景

### 場景 1：Admin 登入
```bash
1. 登入: admin@example.com / Admin@123
2. 訪問: http://localhost:3000/dashboard
3. 預期: 看到 Dashboard, Profile, Users, Settings
```

### 場景 2：User 登入
```bash
1. 登入: user@example.com / User@123
2. 訪問: http://localhost:3000/dashboard
3. 預期: 看到 Dashboard, Profile, Settings
4. 預期: 不會看到 Users
```

### 場景 3：Moderator 登入
```bash
1. 登入: moderator@example.com / Moderator@123
2. 訪問: http://localhost:3000/dashboard
3. 預期: 看到 Dashboard, Profile, Users, Settings
```

### 場景 4：Test 登入
```bash
1. 登入: test@example.com / Test@123
2. 訪問: http://localhost:3000/dashboard
3. 預期: 看到 Dashboard, Profile, Settings
4. 預期: 不會看到 Users
```

---

## 📁 檔案變更

### 整合檔案
- ✅ `prisma/seed.ts` - 整合所有 seed 邏輯

### 已刪除檔案
- ✅ `prisma/seed-menu.ts` - 已刪除（功能已整合到 seed.ts）

---

## 🎯 整合優點

### Before（分離的 Seed）
```
❌ 需要執行多個 seed 腳本
❌ 資料關聯可能出錯
❌ 難以維護
```

### After（整合的 Seed）
```
✅ 單一指令完成所有初始化
✅ 確保資料關聯正確
✅ 包含測試用戶
✅ 易於維護和擴展
```

---

## 🔧 自訂 Seed

### 添加新用戶

```typescript
// Step 8 中添加
const newUser = await prisma.user.upsert({
  where: { email: 'newuser@example.com' },
  update: {},
  create: {
    email: 'newuser@example.com',
    name: 'New User',
    password: await hashPassword('NewUser@123'),
    emailVerified: new Date(),
    status: 'active'
  }
})

// Step 9 中分配角色
{ userId: newUser.id, roleId: userRole.id }

// Step 10 中創建登入方法
{ userId: newUser.id, method: 'password' }
```

### 添加新選單

```typescript
// Step 6 中添加
{
  name: 'reports',
  displayName: 'Reports',
  description: 'View reports',
  path: '/dashboard/reports',
  icon: 'BarChart',
  type: 'LINK',
  order: 4,
  isVisible: true,
  isDisabled: false,
  applicationId: dashboardApp.id,
}
```

### 設定選單權限

```typescript
// Step 7 中添加
{
  menuItemId: reportsMenuItem.id,
  roleId: adminRole.id,
  canView: true,
  canAccess: true,
}
```

---

## 📊 資料庫狀態檢查

### SQL 查詢

```sql
-- 查看所有用戶及角色
SELECT 
  u.email,
  u.name,
  r.name as role
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id;

-- 查看選單項目及權限
SELECT 
  m.name,
  m."displayName",
  CASE 
    WHEN COUNT(mir.id) = 0 THEN 'Public'
    ELSE STRING_AGG(r.name, ', ')
  END as roles
FROM "MenuItem" m
LEFT JOIN "MenuItemRole" mir ON m.id = mir."menuItemId"
LEFT JOIN "Role" r ON mir."roleId" = r.id
GROUP BY m.id, m.name, m."displayName"
ORDER BY m."order";
```

---

## 🎉 總結

### ✅ 整合成果

1. **單一 Seed 腳本** - 所有初始化邏輯集中管理
2. **測試用戶完整** - 4 個不同角色的測試帳號
3. **資料關聯正確** - User → Role → MenuItem 完整串接
4. **選單權限設定** - Users 選單僅 admin & moderator 可見
5. **易於維護** - 清晰的步驟和註解

### 🚀 準備就緒

```bash
# 執行 Seed
npx tsx prisma/seed.ts

# 啟動應用
pnpm dev

# 開始測試！
```

---

**整合完成！準備好測試動態選單系統了！** 🎊
