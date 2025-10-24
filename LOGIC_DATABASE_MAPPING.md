# 程式邏輯與資料表對應詳細表

## 🔍 核心函數與資料表映射

### 認證相關

| 函數 | 文件 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `signIn()` | `auth.config.ts` | User, Account, LoginMethod | 驗證用戶憑證，記錄登入方式 |
| `callback()` | `auth.config.ts` | User, UserRole, Role, RolePermission, Permission, RoleApplication, Application | 登入後獲取用戶完整權限信息 |
| `session()` | `auth.config.ts` | User, UserRole, Role, Permission, Application | 構建 Session 對象，包含 roles, permissions, applications |

### 權限檢查

| 函數 | 文件 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `getUserRolesAndPermissions()` | `lib/auth/roleService.ts` | User, UserRole, Role, RolePermission, Permission, RoleApplication, Application | 獲取用戶的所有角色、權限和應用 |
| `hasPermission()` | `lib/auth/roleService.ts` | User, UserRole, Role, RolePermission, Permission | 檢查用戶是否有特定權限 |
| `hasApplicationAccess()` | `lib/auth/roleService.ts` | User, UserRole, Role, RoleApplication, Application | 檢查用戶是否有應用訪問權限 |
| `requirePermission()` | `lib/auth/roleService.ts` | User, UserRole, Role, RolePermission, Permission | 創建權限檢查中間件 |
| `checkAdminAuth()` | `lib/auth/admin-check.ts` | User, UserRole, Role | 檢查用戶是否為管理員 |
| `hasApplicationAccess()` | `lib/auth/admin-check.ts` | User, UserRole, Role, RoleApplication, Application | 檢查應用訪問權限 |

### 菜單系統

| 函數 | 文件 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `getUserMenuItems()` | `lib/menu.ts` | UserRole, MenuItem, MenuItemRole | 獲取用戶可見的菜單項目 |
| `getPublicMenuItems()` | `lib/menu.ts` | MenuItem | 獲取無權限限制的公開菜單 |
| `getMenuItemsByRole()` | `lib/menu.ts` | MenuItem, MenuItemRole | 獲取特定角色可見的菜單 |
| `canUserAccessMenuItem()` | `lib/menu.ts` | UserRole, MenuItem, MenuItemRole | 檢查用戶是否可訪問菜單項目 |
| `getAllMenuItems()` | `lib/menu.ts` | MenuItem | 獲取應用的所有菜單項目（管理員用） |
| `buildMenuTree()` | `lib/menu.ts` | MenuItem | 構建層級菜單樹結構 |

### 菜單管理操作

| 函數 | 文件 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `getMenuItems()` | `actions/menu/index.ts` | MenuItem, Application, MenuItemRole, Role | 獲取所有菜單項目（含關聯信息） |
| `getMenuItemsByApplication()` | `actions/menu/index.ts` | MenuItem, MenuItemRole, Role | 按應用獲取菜單項目 |
| `createMenuItem()` | `actions/menu/index.ts` | Application, MenuItem | 創建新菜單項目 |
| `updateMenuItem()` | `actions/menu/index.ts` | MenuItem | 更新菜單項目信息 |
| `deleteMenuItem()` | `actions/menu/index.ts` | MenuItem, MenuItemRole | 刪除菜單項目（級聯刪除 MenuItemRole） |
| `manageMenuItemRoles()` | `actions/menu/index.ts` | MenuItem, MenuItemRole, Role | 管理菜單項目的角色訪問權限 |
| `updateMenuItemsOrder()` | `actions/menu/index.ts` | MenuItem | 批量更新菜單項目排序 |
| `toggleMenuVisibility()` | `actions/menu/index.ts` | MenuItem | 切換菜單項目可見性 |
| `toggleMenuDisabled()` | `actions/menu/index.ts` | MenuItem | 切換菜單項目禁用狀態 |

### 角色管理 API

| 端點 | 方法 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `/api/admin/roles` | GET | Role, RolePermission, Permission | 獲取所有角色及其權限 |
| `/api/admin/roles/[roleId]/permissions` | GET | RolePermission, Permission | 獲取角色的權限 |
| `/api/admin/roles/[roleId]/permissions` | PUT | RolePermission, Permission | 更新角色的權限（事務） |
| `/api/admin/roles/[roleId]/applications` | GET | RoleApplication, Application | 獲取角色的應用訪問權限 |
| `/api/admin/roles/[roleId]/applications` | PUT | RoleApplication, Application | 更新角色的應用訪問權限（事務） |
| `/api/admin/roles/[roleId]/menu-access` | GET | MenuItemRole | 獲取角色的菜單訪問權限 |
| `/api/admin/roles/[roleId]/menu-access` | PUT | MenuItemRole | 更新角色的菜單訪問權限（事務） |

### 應用管理

| 函數 | 文件 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `manageApplicationRoles()` | `actions/application/index.ts` | Application, RoleApplication, Role | 管理應用的角色訪問權限 |

### 中間件與路由保護

| 組件 | 文件 | 涉及表 | 邏輯說明 |
|------|------|--------|--------|
| `middleware()` | `middleware.ts` | User, UserRole, Role, RoleApplication, Application | 路由級別的認證和授權檢查 |
| `withAuth()` | `lib/auth/auth.middleware.ts` | User, UserRole, Role, RolePermission, Permission | API 路由級別的權限檢查 |

---

## 📈 資料流向示例

### 場景 1: 用戶登入並查看菜單

```
1. 用戶提交登入表單
   ↓
2. auth.config.ts → signIn() 驗證 User 表中的密碼
   ↓
3. callback() 執行：
   - 查詢 UserRole 獲取用戶的所有角色
   - 查詢 Role 獲取角色信息
   - 查詢 RolePermission 獲取角色的權限
   - 查詢 RoleApplication 獲取角色的應用訪問權限
   ↓
4. session() 構建 Session 對象
   ↓
5. 前端調用 getUserMenuItems(userId)
   ↓
6. lib/menu.ts 執行：
   - 查詢 UserRole 獲取用戶的 roleIds
   - 查詢 MenuItem 表，過濾條件：
     * isVisible = true
     * isDisabled = false
     * 無 MenuItemRole 記錄 OR (MenuItemRole.canView = true AND roleId 在用戶角色列表中)
   - 構建菜單樹
   ↓
7. 返回用戶可見的菜單
```

### 場景 2: 管理員更新菜單項目的角色訪問權限

```
1. 管理員在後台選擇菜單項目和角色
   ↓
2. 調用 manageMenuItemRoles(data)
   ↓
3. 驗證管理員權限（檢查 roleNames 包含 'admin'）
   ↓
4. 事務開始：
   - 刪除所有現有 MenuItemRole 記錄（WHERE menuItemId = xxx）
   - 批量創建新的 MenuItemRole 記錄
   ↓
5. 事務提交
   ↓
6. 下次用戶查詢菜單時，會根據新的 MenuItemRole 記錄過濾菜單
```

### 場景 3: 檢查用戶是否有特定權限

```
1. 調用 hasPermission(userId, 'users:delete')
   ↓
2. 調用 getUserRolesAndPermissions(userId)
   ↓
3. 查詢流程：
   - User → UserRole (WHERE userId = xxx)
   - UserRole → Role (JOIN Role)
   - Role → RolePermission (WHERE roleId IN (...))
   - RolePermission → Permission (JOIN Permission)
   ↓
4. 檢查 Permission 列表中是否存在 'users:delete'
   ↓
5. 返回 true/false
```

---

## 🔐 權限檢查層次

### 第 1 層: 中間件級別 (middleware.ts)
- 檢查用戶是否已認證
- 檢查用戶是否為管理員
- 檢查用戶是否有應用訪問權限

### 第 2 層: API 路由級別 (lib/auth/auth.middleware.ts)
- 驗證 JWT Token
- 檢查特定角色
- 檢查特定權限

### 第 3 層: Server Actions 級別 (actions/*)
- 驗證 Session
- 檢查管理員權限
- 驗證業務邏輯

---

## 💡 關鍵設計模式

### 1. 多對多關聯
- UserRole: 用戶可以有多個角色
- RolePermission: 角色可以有多個權限
- RoleApplication: 角色可以訪問多個應用
- MenuItemRole: 菜單項目可以被多個角色訪問

### 2. 級聯刪除
- 刪除 User → 自動刪除 UserRole、Session 等
- 刪除 Role → 自動刪除 UserRole、RolePermission、RoleApplication、MenuItemRole
- 刪除 MenuItem → 自動刪除 MenuItemRole

### 3. 事務保證
- 更新角色權限時使用事務
- 更新菜單項目角色訪問時使用事務
- 確保數據一致性

### 4. 層級菜單
- MenuItem 支持 parentId 自引用
- buildMenuTree() 構建層級結構
- 防止循環引用


