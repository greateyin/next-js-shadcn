# Next.js 專案 - 資料表與程式邏輯分析報告

## 📋 執行摘要

本專案是一個基於 **Next.js 15 + Auth.js v5 + Prisma + PostgreSQL** 的企業級應用框架，實現了完整的 **RBAC（角色型訪問控制）** 系統和 **動態菜單管理** 系統。資料表設計與程式邏輯高度相關，形成了一個完整的權限管理生態系統。

---

## 🗄️ 核心資料表結構

### 1. **用戶認證相關表**
| 表名 | 用途 | 關鍵字段 |
|------|------|--------|
| `User` | 用戶基本信息 | id, email, password, status, isTwoFactorEnabled |
| `Account` | OAuth 提供商賬戶 | userId, provider, providerAccountId |
| `Session` | 用戶會話 | userId, sessionToken, expires, lastActivity |
| `LoginMethod` | 登入方式記錄 | userId, method (password/google/github) |
| `VerificationToken` | 郵件驗證令牌 | email, token, expires |
| `PasswordResetToken` | 密碼重置令牌 | email, token, expires |
| `TwoFactorToken` | 雙因素認證令牌 | userId, token, expires, used |
| `TwoFactorConfirmation` | 雙因素確認 | userId |

### 2. **權限管理相關表**
| 表名 | 用途 | 關鍵字段 |
|------|------|--------|
| `Role` | 角色定義 | id, name, description |
| `Permission` | 權限定義 | id, name, description |
| `UserRole` | 用戶-角色關聯 | userId, roleId (多對多) |
| `RolePermission` | 角色-權限關聯 | roleId, permissionId (多對多) |
| `RoleApplication` | 角色-應用關聯 | roleId, applicationId (多對多) |

### 3. **應用與菜單相關表**
| 表名 | 用途 | 關鍵字段 |
|------|------|--------|
| `Application` | 應用定義 | id, name, path, isActive, icon, order |
| `MenuItem` | 菜單項目 | id, name, path, applicationId, parentId, type, order, isVisible, isDisabled |
| `MenuItemRole` | 菜單-角色訪問控制 | menuItemId, roleId, canView, canAccess |

### 4. **審計與日誌表**
| 表名 | 用途 | 關鍵字段 |
|------|------|--------|
| `AuditLog` | 操作審計日誌 | userId, action, status, timestamp, targetUserId, resourceType |

---

## 🔗 資料表關係分析

### 權限檢查流程
```
User → UserRole → Role → RolePermission → Permission
                    ↓
                RoleApplication → Application
                    ↓
                MenuItemRole → MenuItem
```

### 關鍵關聯特性
1. **級聯刪除 (Cascade Delete)**
   - 刪除用戶 → 自動刪除 UserRole、Session、AuditLog 等
   - 刪除角色 → 自動刪除 UserRole、RolePermission、RoleApplication、MenuItemRole

2. **唯一性約束**
   - `UserRole`: (userId, roleId) 唯一
   - `RolePermission`: (roleId, permissionId) 唯一
   - `RoleApplication`: (roleId, applicationId) 唯一
   - `MenuItemRole`: (menuItemId, roleId) 唯一
   - `MenuItem`: (applicationId, name) 和 (applicationId, path) 唯一

3. **複合索引優化**
   - `UserRole`: (userId, roleId) - 權限檢查查詢
   - `RolePermission`: (roleId, permissionId) - 權限查詢
   - `MenuItem`: (parentId, order) - 菜單排序查詢
   - `AuditLog`: (userId, timestamp) - 用戶活動查詢

---

## 💻 程式邏輯與資料表對應

### 1. **用戶認證流程** (`auth.config.ts`)
```
登入 → 驗證密碼 → 查詢 User 表
    → 獲取 UserRole → 獲取 Role → 獲取 RolePermission
    → 構建 Session (包含 roles, permissions, applications)
```

### 2. **權限檢查** (`lib/auth/roleService.ts`)

#### `getUserRolesAndPermissions(userId)`
- 查詢 `User` → `UserRole` → `Role`
- 查詢 `Role` → `RolePermission` → `Permission`
- 查詢 `Role` → `RoleApplication` → `Application`
- 返回用戶的完整權限集合

#### `hasPermission(userId, permissionName)`
- 調用 `getUserRolesAndPermissions()`
- 檢查 Permission 列表中是否存在該權限

#### `hasApplicationAccess(userId, applicationPath)`
- 調用 `getUserRolesAndPermissions()`
- 檢查 Application 列表中是否存在該應用

### 3. **菜單系統** (`lib/menu.ts`)

#### `getUserMenuItems(userId, applicationId?)`
**邏輯流程：**
1. 查詢 `UserRole` 獲取用戶的所有 roleIds
2. 查詢 `MenuItem` 表，過濾條件：
   - `isVisible = true` 且 `isDisabled = false`
   - 滿足以下任一條件：
     - 無 `MenuItemRole` 記錄（公開菜單）
     - 存在 `MenuItemRole` 記錄且 `canView = true` 且 roleId 在用戶角色列表中
3. 按 `parentId` 構建層級菜單樹

#### `canUserAccessMenuItem(userId, menuItemId)`
**邏輯流程：**
1. 查詢 `MenuItem` 及其 `MenuItemRole` 記錄
2. 檢查 `isVisible` 和 `isDisabled` 狀態
3. 如果無 `MenuItemRole` 記錄 → 允許訪問
4. 如果有 `MenuItemRole` 記錄 → 檢查用戶角色是否有 `canAccess = true`

### 4. **菜單管理** (`actions/menu/index.ts`)

#### `createMenuItem(data)`
- 驗證 Application 存在
- 檢查 (applicationId, name) 和 (applicationId, path) 唯一性
- 驗證 parentId 存在且屬於同一應用
- 創建 MenuItem 記錄

#### `manageMenuItemRoles(data)`
- 刪除所有現有 `MenuItemRole` 記錄
- 批量創建新的 `MenuItemRole` 記錄
- 設置 `canView` 和 `canAccess` 權限

### 5. **中間件保護** (`middleware.ts`)
```
請求 → 檢查認證
    → 檢查 Admin 角色 (roleNames 包含 'admin' 或 'super-admin')
    → 檢查應用訪問權限 (applicationPaths)
    → 允許/拒絕
```

---

## 🎯 資料一致性保證

### 1. **事務處理**
- `manageMenuItemRoles()` 使用 `db.$transaction()` 確保原子性
- 刪除舊記錄和創建新記錄在同一事務中

### 2. **級聯操作**
- 刪除 Role → 自動刪除相關 UserRole、RolePermission、RoleApplication、MenuItemRole
- 刪除 MenuItem → 自動刪除相關 MenuItemRole
- 刪除 User → 自動刪除相關 UserRole、Session、AuditLog

### 3. **驗證規則**
- 菜單項目名稱和路徑在應用內唯一
- 防止菜單項目循環引用（父子關係檢查）
- 刪除菜單項目前檢查是否有子項目

---

## 📊 性能優化

### 索引策略
1. **用戶查詢**: `UserRole(userId)`, `UserRole(roleId)`
2. **權限查詢**: `RolePermission(roleId)`, `RolePermission(permissionId)`
3. **菜單查詢**: `MenuItem(applicationId)`, `MenuItem(parentId, order)`
4. **審計查詢**: `AuditLog(userId, timestamp)`, `AuditLog(action, timestamp)`

### 查詢優化
- 使用 `select` 只查詢必要字段
- 使用 `include` 進行關聯查詢而非多次查詢
- 使用複合索引加速複雜查詢

---

## ✅ 結論

該專案的資料表設計與程式邏輯**高度相關且一致**：

✅ **RBAC 系統完整** - User → Role → Permission 三層結構清晰
✅ **菜單系統靈活** - 支持層級菜單和細粒度權限控制
✅ **應用隔離** - 支持多應用場景和跨子域 SSO
✅ **數據一致性** - 級聯刪除和事務保證數據完整性
✅ **性能優化** - 合理的索引和查詢設計
✅ **安全防護** - 三層防護（Middleware + API + Server Actions）


