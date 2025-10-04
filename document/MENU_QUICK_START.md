# Menu Management - Quick Start Guide

## 🚀 快速開始

### 訪問管理介面

```
http://localhost:3000/admin/menu
```

---

## 📝 基本操作

### 1. 創建選單項目

1. 點擊右上角 **"Add Menu Item"** 按鈕
2. 填寫必填欄位：
   - **Application**: 選擇所屬應用程式
   - **Name**: 內部名稱（如 `user-management`）
   - **Display Name**: 顯示名稱（如 `User Management`）
   - **Path**: URL 路徑（如 `/admin/users`）
3. 選填欄位：
   - **Description**: 描述或提示文字
   - **Icon**: 選擇 Lucide 圖標
   - **Type**: 選單類型（LINK/GROUP/DIVIDER/EXTERNAL）
   - **Parent Item**: 父選單項目（用於建立子選單）
   - **Order**: 排序順序（數字越小越前面）
4. 設定狀態：
   - **Visible**: 是否在選單中顯示
   - **Disabled**: 是否禁用
5. 點擊 **"Create"** 完成

### 2. 編輯選單項目

1. 在表格中找到要編輯的選單項目
2. 點擊右側的 **⋮** 選單
3. 選擇 **"Edit"**
4. 修改欄位
5. 點擊 **"Update"** 保存

### 3. 管理角色權限

1. 在表格中找到選單項目
2. 點擊右側的 **⋮** 選單
3. 選擇 **"Manage Roles"**
4. 使用搜尋和篩選功能找到目標角色
5. 勾選要授予權限的角色
6. 使用批量操作按鈕快速選擇：
   - **Select All**: 全選
   - **Deselect All**: 全不選
   - **Invert Selection**: 反選
   - **Select Filtered**: 選擇篩選結果
7. 點擊 **"Save Changes"** 完成

### 4. 刪除選單項目

1. 在表格中找到要刪除的選單項目
2. 點擊右側的 **⋮** 選單
3. 選擇 **"Delete"**
4. 確認刪除

**注意**: 無法刪除有子項目的選單項目，需先刪除或重新分配子項目。

---

## 🔍 搜尋和篩選

### 搜尋框
- 可搜尋選單名稱、路徑、描述
- 即時顯示搜尋結果

### 應用程式篩選
- 下拉選單選擇特定應用程式
- 顯示該應用程式下的所有選單項目

### 類型篩選
- **All Types**: 顯示所有類型
- **Link**: 僅顯示普通連結
- **Group**: 僅顯示分組標題
- **Divider**: 僅顯示分隔線
- **External**: 僅顯示外部連結

---

## 📋 選單類型說明

### LINK（普通連結）
- 可點擊的選單項目
- 導航到應用程式內的頁面
- **範例**: 用戶管理、角色管理

### GROUP（分組標題）
- 不可點擊的標題
- 用於將相關選單項目分組
- **範例**: "系統設置"、"用戶管理"

### DIVIDER（分隔線）
- 視覺分隔符
- 用於分隔不同的選單區塊
- 通常不需要設置圖標和路徑

### EXTERNAL（外部連結）
- 在新標籤頁打開的連結
- 導航到外部網站或服務
- **範例**: 文檔連結、外部工具

---

## 🌳 建立階層式選單

### 範例：創建兩層選單結構

#### 1. 創建父選單項目

```
Name: user-management
Display Name: User Management
Path: /admin/users
Type: GROUP (或 LINK)
Parent Item: None
Order: 10
```

#### 2. 創建子選單項目

```
Name: user-list
Display Name: User List
Path: /admin/users/list
Type: LINK
Parent Item: User Management  ← 選擇父項目
Order: 1
```

```
Name: user-create
Display Name: Create User
Path: /admin/users/create
Type: LINK
Parent Item: User Management  ← 選擇父項目
Order: 2
```

### 結果

```
User Management (父項目)
  ├── User List (子項目 1)
  └── Create User (子項目 2)
```

---

## 🎯 最佳實踐

### 命名規範

| 欄位 | 格式 | 範例 |
|------|------|------|
| Name | 小寫-連字符 | `user-management` |
| Display Name | 標題格式 | `User Management` |
| Path | REST 風格 | `/admin/users` |

### 排序策略

使用 10 的倍數便於插入新項目：

```
Dashboard     - Order: 0
Users         - Order: 10
Roles         - Order: 20
Applications  - Order: 30
Settings      - Order: 40
```

如需在 Users 和 Roles 之間插入新項目：

```
Users         - Order: 10
New Item      - Order: 15  ← 新插入
Roles         - Order: 20
```

### 圖標選擇

| 功能類型 | 建議圖標 |
|----------|----------|
| 儀表板 | LayoutDashboard |
| 用戶 | Users, UserCircle |
| 角色 | Shield, UserCheck |
| 設置 | Settings, Sliders |
| 檔案 | FileText, Folder |
| 列表 | List, Grid |
| 創建 | Plus, PlusCircle |
| 編輯 | Edit, Pencil |
| 刪除 | Trash, Trash2 |

---

## ⚠️ 常見問題

### Q: 為什麼無法刪除選單項目？

**A**: 該選單項目可能有子項目。需要先：
1. 刪除所有子項目，或
2. 將子項目重新分配到其他父項目

### Q: 為什麼創建時提示名稱已存在？

**A**: 選單名稱在同一應用程式內必須唯一。嘗試：
1. 使用不同的名稱
2. 檢查是否有重複的選單項目

### Q: 為什麼路徑重複？

**A**: 路徑在同一應用程式內必須唯一。每個選單項目需要有獨特的路徑。

### Q: 如何創建多層選單？

**A**: 逐層創建：
1. 先創建頂層項目
2. 再創建第二層項目（選擇第一層作為父項目）
3. 繼續創建更深層次的項目

### Q: 為什麼設置父項目時報錯？

**A**: 可能的原因：
1. 父項目不屬於同一應用程式
2. 會造成循環參照（將父項目設為自己的子項目）
3. 父項目是 DIVIDER 類型（分隔線不能作為父項目）

---

## 📊 角色權限管理技巧

### 快速授權所有角色
1. 打開 "Manage Roles" 對話框
2. 點擊 **"Select All"**
3. 點擊 **"Save Changes"**

### 排除特定角色
1. 點擊 **"Select All"**
2. 使用搜尋框找到要排除的角色
3. 點擊 **"Deselect Filtered"**
4. 清除搜尋框
5. 點擊 **"Save Changes"**

### 僅授權特定角色群組
1. 使用搜尋框輸入關鍵字（如 "admin"）
2. 點擊 **"Select Filtered"**
3. 重複搜尋和選擇其他群組
4. 點擊 **"Save Changes"**

### 檢查已授權角色
1. 打開 "Manage Roles" 對話框
2. 點擊 **"Selected"** 篩選器
3. 查看所有已選擇的角色

---

## 🎨 狀態標記說明

### 表格中的標記

| 標記 | 說明 |
|------|------|
| 🟢 **Active** | 可見且啟用 |
| 👁️ **Hidden** | 隱藏但啟用 |
| 🚫 **Disabled** | 禁用（無法訪問） |

### 組合狀態

- **Visible + Enabled** = 顯示在選單中且可點擊
- **Visible + Disabled** = 顯示但無法點擊（灰色）
- **Hidden + Enabled** = 不顯示但可通過 URL 訪問
- **Hidden + Disabled** = 完全無法訪問

---

## 💡 使用場景

### 場景 1：創建基本選單結構

**目標**: 為新應用程式創建基本選單

```
1. Dashboard (首頁)
2. Users (用戶管理)
   - User List
   - Create User
3. Settings (設置)
```

**步驟**:
1. 創建 Dashboard (order: 0)
2. 創建 Users (order: 10)
3. 創建 User List (parent: Users, order: 1)
4. 創建 Create User (parent: Users, order: 2)
5. 創建 Settings (order: 20)

### 場景 2：臨時隱藏功能

**目標**: 暫時隱藏某個功能但保留配置

**步驟**:
1. 編輯選單項目
2. 關閉 **Visible** 開關
3. 保持 **Disabled** 關閉
4. 點擊 **Update**

### 場景 3：功能維護中

**目標**: 顯示選單項目但禁止訪問

**步驟**:
1. 編輯選單項目
2. 保持 **Visible** 開啟
3. 開啟 **Disabled** 開關
4. 在描述中說明維護資訊
5. 點擊 **Update**

---

## 🔗 相關資源

- [完整實作文檔](./MENU_MANAGEMENT_IMPLEMENTATION.md)
- [Application Management](./APPLICATION_FEATURES.md)
- [Role Management](./MENU_ROLE_QUICK_START.md)
- [Manage Roles Dialog 改進](./frontend/manage-roles-dialog-improvements.md)

---

**更新日期**: 2025-10-04
