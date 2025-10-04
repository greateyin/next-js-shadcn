# Menu Management Implementation

## 📋 概述

完整實作了 Menu（選單項目）管理系統，包含 CRUD 操作、階層式選單結構、角色存取控制等功能。

**訪問路徑**: `http://localhost:3000/admin/menu`

---

## 🎯 功能特性

### 1. **完整的 CRUD 操作**
- ✅ 創建選單項目
- ✅ 編輯選單項目
- ✅ 刪除選單項目（含子項目檢查）
- ✅ 查看選單項目列表

### 2. **階層式選單結構**
- ✅ 支援父子關係
- ✅ 防止循環參照
- ✅ 顯示子項目數量
- ✅ 父項目選擇器

### 3. **選單項目類型**
- **LINK** - 普通連結（可點擊導航）
- **GROUP** - 分組標題（不可點擊，僅用於分類）
- **DIVIDER** - 分隔線（視覺分隔符）
- **EXTERNAL** - 外部連結（在新標籤頁打開）

### 4. **角色存取控制**
- ✅ 管理選單項目的角色權限
- ✅ 批量選擇/取消選擇
- ✅ 搜尋和篩選角色
- ✅ 反選功能
- ✅ 統計顯示

### 5. **進階篩選與搜尋**
- ✅ 搜尋選單項目（名稱、路徑、描述）
- ✅ 按應用程式篩選
- ✅ 按類型篩選
- ✅ 即時搜尋結果

### 6. **狀態管理**
- ✅ 可見性控制（isVisible）
- ✅ 禁用狀態（isDisabled）
- ✅ 排序順序（order）
- ✅ 視覺化狀態標記

### 7. **圖標支援**
- ✅ 100+ Lucide 圖標選擇
- ✅ 圖標預覽
- ✅ 可選配置

---

## 📁 檔案結構

```
.
├── schemas/
│   └── menu.ts                                    # Zod 驗證 schemas
├── actions/
│   └── menu/
│       └── index.ts                               # Server actions
├── app/
│   ├── api/
│   │   └── menu/
│   │       └── route.ts                           # API routes
│   └── admin/
│       └── menu/
│           └── page.tsx                           # Menu 管理頁面
└── components/
    └── admin/
        └── menu/
            ├── MenuTable.tsx                      # 選單項目列表
            ├── MenuFormDialog.tsx                 # 創建/編輯對話框
            └── ManageMenuRolesDialog.tsx          # 角色權限管理對話框
```

---

## 🗄️ 資料庫結構

### MenuItem Table

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | String | 唯一標識符 |
| `name` | String | 內部名稱 |
| `displayName` | String | 顯示名稱 |
| `description` | String? | 描述/提示文字 |
| `path` | String | URL 路徑 |
| `icon` | String? | Lucide 圖標名稱 |
| `type` | MenuItemType | 選單類型 |
| `parentId` | String? | 父項目 ID |
| `applicationId` | String | 所屬應用程式 ID |
| `order` | Int | 排序順序 |
| `isVisible` | Boolean | 是否可見 |
| `isDisabled` | Boolean | 是否禁用 |
| `createdAt` | DateTime | 創建時間 |
| `updatedAt` | DateTime | 更新時間 |

**關聯**:
- `application` - 所屬應用程式
- `parent` - 父選單項目
- `children` - 子選單項目列表
- `roleAccess` - 角色存取權限列表

**唯一約束**:
- `[applicationId, name]` - 應用程式內名稱唯一
- `[applicationId, path]` - 應用程式內路徑唯一

**索引**:
- `applicationId` - 應用程式查詢
- `parentId` - 父項目查詢
- `[parentId, order]` - 同層級排序
- `[isVisible, order]` - 可見選單排序
- `type` - 類型篩選

### MenuItemRole Table

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | String | 唯一標識符 |
| `menuItemId` | String | 選單項目 ID |
| `roleId` | String | 角色 ID |
| `canView` | Boolean | 可查看 |
| `canAccess` | Boolean | 可存取 |
| `createdAt` | DateTime | 創建時間 |
| `updatedAt` | DateTime | 更新時間 |

**關聯**:
- `menuItem` - 選單項目
- `role` - 角色

**唯一約束**:
- `[menuItemId, roleId]` - 選單項目與角色組合唯一

---

## 🔧 API 端點

### Server Actions

| Function | 說明 | 參數 |
|----------|------|------|
| `getMenuItems()` | 獲取所有選單項目 | - |
| `getMenuItemsByApplication(applicationId)` | 獲取特定應用程式的選單項目 | applicationId |
| `createMenuItem(data)` | 創建選單項目 | CreateMenuItemInput |
| `updateMenuItem(data)` | 更新選單項目 | UpdateMenuItemInput |
| `deleteMenuItem(data)` | 刪除選單項目 | DeleteMenuItemInput |
| `manageMenuItemRoles(data)` | 管理角色存取權限 | ManageMenuItemRolesInput |
| `updateMenuItemsOrder(data)` | 批量更新順序 | UpdateMenuItemsOrderInput |

### REST API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/menu` | 獲取所有選單項目 |

---

## 💻 使用範例

### 1. 創建選單項目

```typescript
import { createMenuItem } from "@/actions/menu";

const result = await createMenuItem({
  name: "user-management",
  displayName: "User Management",
  description: "Manage system users",
  path: "/admin/users",
  icon: "Users",
  type: "LINK",
  parentId: null,
  applicationId: "app-id",
  order: 1,
  isVisible: true,
  isDisabled: false,
});
```

### 2. 創建子選單項目

```typescript
const result = await createMenuItem({
  name: "user-list",
  displayName: "User List",
  description: "View all users",
  path: "/admin/users/list",
  icon: "List",
  type: "LINK",
  parentId: "parent-menu-id", // 父項目 ID
  applicationId: "app-id",
  order: 1,
  isVisible: true,
  isDisabled: false,
});
```

### 3. 更新選單項目

```typescript
import { updateMenuItem } from "@/actions/menu";

const result = await updateMenuItem({
  id: "menu-item-id",
  displayName: "Updated Name",
  isVisible: false, // 隱藏選單項目
});
```

### 4. 管理角色存取權限

```typescript
import { manageMenuItemRoles } from "@/actions/menu";

const result = await manageMenuItemRoles({
  menuItemId: "menu-item-id",
  roleIds: ["role-id-1", "role-id-2"],
  canView: true,
  canAccess: true,
});
```

### 5. 刪除選單項目

```typescript
import { deleteMenuItem } from "@/actions/menu";

const result = await deleteMenuItem({
  id: "menu-item-id",
});
```

---

## 🎨 UI 組件使用

### MenuTable 組件

```tsx
import { MenuTable } from "@/components/admin/menu/MenuTable";

<MenuTable
  menuItems={menuItems}
  applications={applications}
  availableRoles={availableRoles}
  onRefresh={loadData}
/>
```

**功能**:
- 顯示選單項目列表
- 搜尋和篩選
- 編輯和刪除操作
- 管理角色權限

### MenuFormDialog 組件

```tsx
import { MenuFormDialog } from "@/components/admin/menu/MenuFormDialog";

<MenuFormDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  menuItem={selectedMenuItem} // 編輯模式時傳入
  applications={applications}
  menuItems={menuItems}
  onSuccess={onRefresh}
/>
```

**功能**:
- 創建/編輯選單項目
- 表單驗證
- 圖標選擇器
- 父項目選擇器

### ManageMenuRolesDialog 組件

```tsx
import { ManageMenuRolesDialog } from "@/components/admin/menu/ManageMenuRolesDialog";

<ManageMenuRolesDialog
  open={isRolesDialogOpen}
  onOpenChange={setIsRolesDialogOpen}
  menuItemId={menuItemId}
  menuItemName={menuItemName}
  currentRoleIds={currentRoleIds}
  availableRoles={availableRoles}
  onSuccess={onRefresh}
/>
```

**功能**:
- 管理角色存取權限
- 搜尋和篩選角色
- 批量操作
- 統計顯示

---

## ✅ 驗證規則

### 名稱（name）
- ✅ 必填
- ✅ 最多 50 字元
- ✅ 只能包含字母、數字、連字符和底線
- ✅ 應用程式內唯一

### 顯示名稱（displayName）
- ✅ 必填
- ✅ 最多 100 字元

### 描述（description）
- ✅ 選填
- ✅ 最多 500 字元

### 路徑（path）
- ✅ 必填
- ✅ 最多 200 字元
- ✅ 必須以 `/` 開頭
- ✅ 只能包含有效的 URL 字元
- ✅ 應用程式內唯一

### 圖標（icon）
- ✅ 選填
- ✅ 最多 50 字元
- ✅ 必須是有效的 Lucide 圖標名稱

### 順序（order）
- ✅ 必須是非負整數
- ✅ 預設值為 0

---

## 🔒 安全性

### 權限檢查
- ✅ 所有 server actions 都需要 admin 權限
- ✅ 使用 `currentUser()` 驗證用戶身份
- ✅ 檢查 `user.role === UserRole.admin`

### 資料驗證
- ✅ 使用 Zod schemas 進行輸入驗證
- ✅ 檢查關聯資料是否存在
- ✅ 防止循環參照
- ✅ 檢查唯一性約束

### 錯誤處理
- ✅ Try-catch 捕獲異常
- ✅ 返回明確的錯誤訊息
- ✅ 記錄錯誤日誌

---

## 🎯 業務邏輯

### 1. 防止循環參照

當設置父項目時，系統會遞迴檢查是否會造成循環參照：

```typescript
const checkCircularReference = async (itemId: string, targetId: string): Promise<boolean> => {
  const children = await db.menuItem.findMany({
    where: { parentId: itemId },
    select: { id: true },
  });

  for (const child of children) {
    if (child.id === targetId) return true;
    if (await checkCircularReference(child.id, targetId)) return true;
  }

  return false;
};
```

### 2. 刪除保護

刪除選單項目前會檢查是否有子項目：

```typescript
if (menuItem._count.children > 0) {
  return {
    error: `Cannot delete menu item with ${menuItem._count.children} child item(s). 
            Please delete or reassign child items first.`,
  };
}
```

### 3. 唯一性檢查

創建或更新時檢查名稱和路徑的唯一性：

```typescript
// 檢查 name 唯一性
const existingName = await db.menuItem.findUnique({
  where: {
    applicationId_name: {
      applicationId: validatedData.applicationId,
      name: validatedData.name,
    },
  },
});

// 檢查 path 唯一性
const existingPath = await db.menuItem.findUnique({
  where: {
    applicationId_path: {
      applicationId: validatedData.applicationId,
      path: validatedData.path,
    },
  },
});
```

---

## 🎨 UI/UX 特性

### Apple Style 設計
- ✅ 白色背景 (`bg-white`)
- ✅ 灰色邊框 (`border-gray-200/50`)
- ✅ 藍色強調 (`bg-blue-600`)
- ✅ 平滑過渡動畫
- ✅ 玻璃效果 (`backdrop-blur-sm`)

### 響應式設計
- ✅ 手機、平板、桌面適配
- ✅ 彈性佈局
- ✅ 可滾動區域

### 互動反饋
- ✅ 懸停效果
- ✅ 載入狀態
- ✅ 成功/錯誤提示
- ✅ 確認對話框

---

## 📊 表格功能

### 顯示資訊
- 選單名稱和內部名稱
- 路徑（程式碼格式）
- 所屬應用程式
- 類型標記（含圖標）
- 父項目
- 排序順序
- 狀態標記（可見/隱藏/禁用）
- 角色數量

### 操作選項
- ✏️ 編輯選單項目
- 🛡️ 管理角色權限
- 🗑️ 刪除選單項目

### 篩選選項
- 🔍 搜尋框（名稱、路徑、描述）
- 📱 應用程式下拉選單
- 📑 類型下拉選單

---

## 🧪 測試清單

### 功能測試

#### 創建選單項目
- [ ] 創建頂層選單項目
- [ ] 創建子選單項目
- [ ] 選擇不同的選單類型
- [ ] 選擇圖標
- [ ] 設置排序順序
- [ ] 設置可見性和禁用狀態

#### 編輯選單項目
- [ ] 更新名稱和顯示名稱
- [ ] 更新路徑
- [ ] 更改父項目
- [ ] 更改類型
- [ ] 更新排序順序
- [ ] 切換可見性和禁用狀態

#### 刪除選單項目
- [ ] 刪除無子項目的選單項目
- [ ] 嘗試刪除有子項目的選單項目（應阻止）
- [ ] 確認刪除對話框

#### 角色管理
- [ ] 分配角色權限
- [ ] 批量選擇/取消選擇
- [ ] 搜尋角色
- [ ] 篩選已選擇/未選擇角色
- [ ] 反選功能

#### 搜尋和篩選
- [ ] 搜尋選單項目
- [ ] 按應用程式篩選
- [ ] 按類型篩選
- [ ] 組合篩選

### 驗證測試

- [ ] 必填欄位驗證
- [ ] 名稱格式驗證
- [ ] 路徑格式驗證
- [ ] 唯一性檢查
- [ ] 循環參照檢查
- [ ] 父項目應用程式一致性檢查

### 邊界測試

- [ ] 空資料狀態
- [ ] 大量選單項目（100+）
- [ ] 深層階層（5+ 層）
- [ ] 長名稱和描述
- [ ] 特殊字元處理

---

## 🚀 部署注意事項

### 1. 資料庫遷移

確保 Prisma schema 已同步：

```bash
pnpm prisma generate
pnpm prisma db push
```

### 2. 環境變數

確保設置了正確的資料庫連接：

```env
DATABASE_URL="postgresql://..."
```

### 3. 權限設置

確保 admin 角色已正確設置：

```typescript
// 檢查用戶角色
const user = await currentUser();
if (!user || user.role !== UserRole.admin) {
  return { error: "Unauthorized" };
}
```

---

## 📝 後續改進建議

### 1. 拖放排序
實作拖放功能來調整選單項目順序：
```typescript
// 使用 @dnd-kit/core 或 react-beautiful-dnd
```

### 2. 批量操作
添加批量刪除、批量更新狀態等功能：
```typescript
// 選擇多個選單項目進行批量操作
```

### 3. 選單預覽
實時預覽選單結構：
```typescript
// 顯示選單的階層樹狀結構
```

### 4. 導入/導出
支援 JSON 格式的選單配置導入導出：
```typescript
// 導出選單配置為 JSON
// 從 JSON 導入選單配置
```

### 5. 版本控制
追蹤選單配置的變更歷史：
```typescript
// 記錄每次修改的歷史
// 支援回滾到之前的版本
```

### 6. 權限細分
更細緻的權限控制：
- `canView` - 可以在選單中看到
- `canAccess` - 可以點擊進入
- `canEdit` - 可以編輯頁面內容
- `canDelete` - 可以刪除資料

---

## 🎓 最佳實踐

### 1. 命名規範
- **name**: 使用小寫、連字符分隔 (e.g., `user-management`)
- **displayName**: 使用標題格式 (e.g., `User Management`)
- **path**: 遵循 REST 風格 (e.g., `/admin/users`)

### 2. 排序策略
- 使用 10 的倍數 (0, 10, 20, 30...) 方便插入新項目
- 同層級內保持順序一致
- 重要功能放在前面

### 3. 類型選擇
- **LINK**: 用於普通導航項目
- **GROUP**: 用於分組標題（不可點擊）
- **DIVIDER**: 用於視覺分隔
- **EXTERNAL**: 用於外部連結（新標籤頁）

### 4. 圖標選擇
- 選擇語義明確的圖標
- 保持整體風格一致
- 優先使用常見圖標

### 5. 權限管理
- 使用最小權限原則
- 定期審查角色權限
- 文檔化權限結構

---

## 📚 相關文件

- [Application Management](./APPLICATION_FEATURES.md)
- [Role Management](./MENU_ROLE_QUICK_START.md)
- [Dynamic Menu Implementation](./DYNAMIC_MENU_IMPLEMENTATION.md)
- [Manage Roles Dialog Improvements](./frontend/manage-roles-dialog-improvements.md)

---

## ✅ 完成清單

- ✅ 資料庫 Schema 設計
- ✅ Zod 驗證 Schemas
- ✅ Server Actions 實作
- ✅ API Routes 實作
- ✅ Menu 管理頁面
- ✅ MenuTable 組件
- ✅ MenuFormDialog 組件
- ✅ ManageMenuRolesDialog 組件
- ✅ 搜尋和篩選功能
- ✅ 角色權限管理
- ✅ 循環參照檢查
- ✅ 刪除保護
- ✅ 表單驗證
- ✅ 錯誤處理
- ✅ 文檔撰寫

---

**實作日期**: 2025-10-04  
**版本**: 1.0.0  
**狀態**: ✅ 完成
