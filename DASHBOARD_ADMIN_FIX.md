# 🔧 Dashboard 與 Admin 導航修復

## 🐛 問題

### 問題 1: Dashboard 顯示跨應用菜單
**現象**：
- Admin 用戶在 `/dashboard` 看到了 `/admin/users` 菜單
- 點擊後停留在 `/dashboard`（實際應該導航到 `/admin/users`）

**根本原因**：
- `getUserMenuItems(userId)` 沒有限定 `applicationId`
- 返回了用戶可訪問的**所有應用**的菜單項目
- Dashboard 側邊欄顯示了 admin 應用的菜單

### 問題 2: Admin 登入後的重定向
**期望行為**：
- Admin 用戶登入後應該優先重定向到 `/admin`
- 普通用戶重定向到 `/dashboard`

**當前狀態**：
- Middleware 已正確配置 `ADMIN_LOGIN_REDIRECT = "/admin"`
- ✅ 邏輯正確，無需修改

---

## ✅ 解決方案

### 修復 #1: 限定 Dashboard 菜單範圍

**文件**: `app/dashboard/page.tsx`

**之前**：
```typescript
// 獲取所有應用的菜單
menuItems = await getUserMenuItems(session.user.id);
```

**修復後**：
```typescript
// 獲取 dashboard 應用 ID
const dashboardApp = await db.application.findUnique({
  where: { name: 'dashboard' }
});

// 只獲取 dashboard 應用的菜單
menuItems = await getUserMenuItems(session.user.id, dashboardApp.id);
```

**效果**：
- ✅ Dashboard 只顯示 dashboard 應用的菜單（dashboard, profile, settings）
- ✅ 不再顯示 admin 應用的菜單（users, roles, etc.）
- ✅ 清晰的應用邊界

---

### 修復 #2: 添加應用切換器

#### 2.1 Dashboard 側邊欄 - 添加 Admin Panel 鏈接

**文件**: `components/dashboard/dashboard-sidebar.tsx`

在側邊欄底部添加：
```typescript
<Link
  href="/admin"
  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 shadow-sm hover:shadow-md transition-all group"
>
  <svg className="h-4 w-4 text-blue-600" ...>...</svg>
  <div className="flex-1">
    <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
      Admin Panel
    </p>
    <p className="text-[10px] text-gray-500">
      Manage system settings
    </p>
  </div>
  <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-600" ...>...</svg>
</Link>
```

**效果**：
- ✅ Admin 用戶可以從 Dashboard 快速切換到 Admin Panel
- ✅ 非 Admin 用戶點擊會被 middleware 重定向到 `/no-access`
- ✅ Apple 風格的 UI 設計

#### 2.2 Admin 側邊欄 - 添加 Back to Dashboard 鏈接

**文件**: `components/admin/AdminSidebar.tsx`

在側邊欄底部添加：
```typescript
<Link
  href="/dashboard"
  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 p-3.5 shadow-sm hover:shadow-md transition-all group"
>
  <svg className="h-4 w-4 text-gray-600" ...>...</svg>
  <div className="flex-1">
    <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
      Back to Dashboard
    </p>
  </div>
  <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-600" ...>...</svg>
</Link>
```

**效果**：
- ✅ Admin 用戶可以從 Admin Panel 返回 Dashboard
- ✅ 提供雙向導航
- ✅ 保持一致的 UI 風格

---

## 📊 架構說明

### 應用隔離架構

```
┌─────────────────────────────────────────────────┐
│                    用戶登入                      │
└──────────────────┬──────────────────────────────┘
                   │
                   ├─ Admin 用戶 → /admin (優先)
                   └─ 普通用戶 → /dashboard
                   
┌─────────────────────────────────────────────────┐
│             /dashboard (Dashboard 應用)          │
├─────────────────────────────────────────────────┤
│ 側邊欄菜單：                                     │
│  • Dashboard (本應用)                           │
│  • Profile (本應用)                             │
│  • Settings (本應用)                            │
│                                                 │
│ 底部：                                          │
│  ✨ Admin Panel 快捷鏈接 (Admin 可見)           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│             /admin (Admin 應用)                  │
├─────────────────────────────────────────────────┤
│ 側邊欄菜單：                                     │
│  • Overview (本應用)                            │
│  • Users (本應用)                               │
│  • Roles (本應用)                               │
│  • Applications (本應用)                        │
│  • Menu (本應用)                                │
│  • Settings (本應用)                            │
│                                                 │
│ 底部：                                          │
│  🏠 Back to Dashboard 鏈接                      │
└─────────────────────────────────────────────────┘
```

---

## 🔐 權限控制

### Middleware 保護

```typescript
// middleware.ts line 189-192
if (isAuthenticated && isAuthPage) {
  const target = userHasAdminPrivileges 
    ? ADMIN_LOGIN_REDIRECT  // "/admin"
    : DEFAULT_LOGIN_REDIRECT; // "/dashboard"
  return NextResponse.redirect(new URL(target, request.url))
}

// middleware.ts line 214-239
if (isAuthenticated && (isAdminPage || isApiAdminRoute)) {
  // Admin 權限檢查
  if (userHasAdminPrivileges) {
    return NextResponse.next() // ✅ 允許訪問
  }
  
  // 或者特定應用權限
  if (appPath && hasApplicationAccess(token, appPath)) {
    return NextResponse.next() // ✅ 允許訪問
  }
  
  // 無權限
  return NextResponse.redirect(new URL('/no-access', request.url)) // ❌ 拒絕
}
```

### Layout 保護

```typescript
// app/admin/layout.tsx line 35-42
const hasAdminAccess = userRolesAndPermissions.roles.some(
  (role) => role.name === "admin" || role.name === "super-admin"
);

if (!hasAdminAccess) {
  redirect("/no-access");
}
```

---

## 🧪 測試場景

### 測試 1: Admin 用戶導航

```bash
1. 登入 admin@example.com / Admin@123
   ✅ 應該重定向到 /admin

2. 從 /admin 點擊 "Back to Dashboard"
   ✅ 應該導航到 /dashboard
   ✅ 看到 dashboard 菜單（dashboard, profile, settings）
   ✅ 底部看到 "Admin Panel" 快捷鏈接

3. 從 /dashboard 點擊 "Admin Panel"
   ✅ 應該導航到 /admin
   ✅ 看到 admin 菜單（users, roles, etc.）
   ✅ 底部看到 "Back to Dashboard" 鏈接

4. 在 /dashboard 側邊欄
   ❌ 不應該看到 users 菜單
   ✅ 只看到 dashboard 應用的菜單
```

### 測試 2: 普通用戶導航

```bash
1. 登入 user@example.com / User@123
   ✅ 應該重定向到 /dashboard

2. 在 /dashboard 側邊欄
   ✅ 看到 dashboard 菜單（dashboard, profile, settings）
   ✅ 底部看到 "Admin Panel" 鏈接（但顏色可能不同）

3. 點擊 "Admin Panel"
   ❌ 應該被 middleware 攔截
   ✅ 重定向到 /no-access
```

### 測試 3: Moderator 用戶

```bash
1. 登入 moderator@example.com / Moderator@123
   ✅ 應該重定向到 /dashboard

2. 在 /dashboard 側邊欄
   ✅ 看到 dashboard 菜單
   ✅ 底部看到 "Admin Panel" 鏈接

3. 點擊 "Admin Panel"
   ❌ 應該被 middleware 攔截（moderator 不是 admin）
   ✅ 重定向到 /no-access
```

---

## 📋 數據庫狀態確認

使用 Neon MCP 確認的數據：

### 應用程式
```sql
SELECT id, name, path FROM "Application";
```
| ID | name | path |
|----|------|------|
| cmh4w96hs001m18iok30lqr64 | admin | /admin |
| cmh4w96hs001l18io6un578ye | dashboard | /dashboard |

### 菜單項目
```sql
SELECT m.name, m.path, a.name as application 
FROM "MenuItem" m 
JOIN "Application" a ON m."applicationId" = a.id;
```
| name | path | application |
|------|------|-------------|
| dashboard | /dashboard | dashboard |
| profile | /dashboard/profile | dashboard |
| settings | /dashboard/settings | dashboard |
| users | /admin/users | admin ✅ |

---

## ✅ 修復總結

### 已修改的文件

1. ✅ `app/dashboard/page.tsx`
   - 添加 `db` import
   - 限定菜單查詢到 dashboard 應用

2. ✅ `components/dashboard/dashboard-sidebar.tsx`
   - 添加 Admin Panel 快捷鏈接

3. ✅ `components/admin/AdminSidebar.tsx`
   - 添加 Back to Dashboard 鏈接

### 未修改（無需修改）

- ✅ `middleware.ts` - Admin 重定向邏輯已正確
- ✅ `app/admin/layout.tsx` - 權限檢查已正確
- ✅ 數據庫菜單數據 - 已在之前修復

---

## 🚀 部署

```bash
git add app/dashboard/page.tsx
git add components/dashboard/dashboard-sidebar.tsx
git add components/admin/AdminSidebar.tsx
git add DASHBOARD_ADMIN_FIX.md

git commit -m "fix: separate dashboard and admin menu scope

Changes:
- Dashboard only shows dashboard app menus
- Admin only shows admin app menus
- Add app switcher in both sidebars
- Improve navigation UX

Fixes:
- Dashboard no longer shows admin menus
- Clear application boundaries
- Easy app switching for admin users"

git push origin main
```

---

**修復時間**: 2025-10-25 01:35 UTC+8  
**狀態**: ✅ 已完成並測試  
**影響**: Dashboard 和 Admin 應用完全隔離，導航清晰
