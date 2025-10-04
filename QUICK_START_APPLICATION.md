# 🚀 Application 管理功能快速開始指南

## 📋 前置條件

確保以下服務正在運行：

```bash
# 1. 確認 PostgreSQL 正在運行
# 2. 確認資料庫已遷移
pnpm prisma migrate deploy

# 3. (可選) 執行種子資料
pnpm prisma db seed
```

## 🎯 啟動應用程式

```bash
# 安裝依賴（如果還沒有）
pnpm install

# 啟動開發伺服器
pnpm dev
```

訪問：`http://localhost:3000/admin/applications`

## 📚 功能概覽

### 1. 應用程式列表
顯示所有系統應用程式，包括：
- 顯示名稱
- 內部名稱
- 路徑
- 狀態（啟用/停用）
- 關聯角色
- 選單項目數量
- 排序順序

### 2. 搜尋與篩選
- 即時搜尋應用程式名稱
- 自動篩選結果

### 3. 新增應用程式

**點擊「新增應用程式」按鈕**

必填欄位：
- **應用程式名稱**：內部識別名稱（只能包含英數字、連字符、底線）
  - 範例：`user-management`, `order-system`
- **顯示名稱**：使用者看到的名稱
  - 範例：`使用者管理`, `訂單系統`
- **路徑**：應用程式的 URL 路徑
  - 範例：`admin/users`, `dashboard/orders`

選填欄位：
- **描述**：應用程式的詳細說明
- **圖標**：從 Lucide 圖標庫選擇
- **排序**：數字越小越靠前（預設 0）
- **啟用狀態**：控制應用程式是否可見（預設啟用）

### 4. 編輯應用程式

1. 點擊操作選單（⋮）
2. 選擇「編輯」
3. 修改所需欄位
4. 點擊「更新」

### 5. 管理角色存取權限

1. 點擊操作選單（⋮）
2. 選擇「管理角色存取」
3. 勾選/取消勾選角色
4. 使用「全選」或「取消全選」快速操作
5. 點擊「儲存」

### 6. 啟用/停用應用程式

1. 點擊操作選單（⋮）
2. 選擇「啟用」或「停用」
3. 狀態即時更新

### 7. 刪除應用程式

1. 點擊操作選單（⋮）
2. 選擇「刪除」
3. 確認刪除操作

**注意**：
- 如果應用程式有關聯的選單項目或角色，無法刪除
- 需要先移除所有關聯後才能刪除

## 🔒 安全性說明

所有操作都會：
1. 驗證使用者身份
2. 記錄審計日誌
3. 進行資料驗證
4. 檢查資料完整性

## 📊 資料結構

### Application 表

```typescript
{
  id: string           // 唯一識別碼
  name: string         // 應用程式名稱（唯一）
  displayName: string  // 顯示名稱
  description: string? // 描述
  path: string         // 路徑（唯一）
  icon: string?        // 圖標名稱
  order: number        // 排序順序
  isActive: boolean    // 啟用狀態
  createdAt: DateTime  // 創建時間
  updatedAt: DateTime  // 更新時間
}
```

### 關聯表

- **RoleApplication**：角色與應用程式的多對多關聯
- **MenuItem**：應用程式的選單項目

## 🛠️ API 端點

### Server Actions

```typescript
// 創建應用程式
createApplication(data: CreateApplicationInput)

// 更新應用程式
updateApplication(data: UpdateApplicationInput)

// 切換狀態
toggleApplicationStatus(data: ToggleApplicationStatusInput)

// 刪除應用程式
deleteApplication(data: DeleteApplicationInput)

// 管理角色存取
manageApplicationRoles(data: ManageApplicationRolesInput)

// 獲取所有應用程式
getApplications()

// 獲取單個應用程式
getApplicationById(id: string)
```

### REST API

```
GET /api/roles - 獲取所有角色
```

## 📝 使用範例

### 範例 1：創建部落格應用程式

```
應用程式名稱：blog-management
顯示名稱：部落格管理
路徑：admin/blog
描述：管理部落格文章、分類和標籤
圖標：FileText
排序：5
啟用狀態：啟用
```

### 範例 2：創建電商應用程式

```
應用程式名稱：ecommerce
顯示名稱：電商管理
路徑：admin/ecommerce
描述：管理商品、訂單和庫存
圖標：Package
排序：3
啟用狀態：啟用
```

## 🎨 圖標選項

常用圖標：
- `LayoutDashboard` - 儀表板
- `Users` - 使用者
- `Settings` - 設定
- `Shield` - 安全
- `Database` - 資料庫
- `Package` - 套件
- `FileText` - 文件
- `Mail` - 郵件
- `BarChart` - 圖表

完整列表請參考：[Lucide Icons](https://lucide.dev/icons/)

## 🔍 故障排除

### 問題：無法創建應用程式

**可能原因：**
1. 名稱已存在
2. 路徑已存在
3. 驗證規則不符

**解決方案：**
- 檢查錯誤訊息
- 使用不同的名稱/路徑
- 確保符合驗證規則

### 問題：無法刪除應用程式

**可能原因：**
- 有關聯的選單項目或角色

**解決方案：**
1. 先移除角色關聯（使用「管理角色存取」）
2. 刪除關聯的選單項目
3. 再嘗試刪除應用程式

### 問題：角色列表不顯示

**可能原因：**
- API 端點未正常運作
- 資料庫無角色資料

**解決方案：**
```bash
# 執行種子資料
pnpm prisma db seed
```

## 📖 相關文檔

- [重構摘要](./REFACTOR_SUMMARY.md)
- [測試指南](./TEST_APPLICATION_FEATURES.md)
- [資料庫 Schema](./prisma/schema.prisma)

## 💡 最佳實踐

1. **命名規範**
   - 使用 kebab-case 作為應用程式名稱
   - 使用清晰描述性的顯示名稱
   - 路徑遵循一致的結構（如：`admin/{feature}`）

2. **角色管理**
   - 僅授予必要的角色存取權限
   - 定期檢查角色配置

3. **排序順序**
   - 重要應用程式使用較小的數字
   - 預留空間供未來插入（使用 10, 20, 30...）

4. **停用 vs 刪除**
   - 優先使用「停用」而非刪除
   - 只在確定不再需要時才刪除

## 🎯 下一步

創建應用程式後，您可能需要：
1. 為應用程式創建選單項目
2. 配置角色權限
3. 實作應用程式的實際功能頁面

## 🆘 需要幫助？

如有問題或建議，請：
1. 查看測試指南
2. 檢查審計日誌
3. 查看開發者工具的 Console
4. 聯繫開發團隊
