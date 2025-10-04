# 選單資料表設計分析

## 📅 分析日期：2025-10-04

---

## 📊 現有資料表結構

### 1. MenuItem 表

```prisma
model MenuItem {
  id            String      @id @default(cuid())
  name          String      // 內部名稱
  displayName   String      // 顯示名稱
  path          String      // URL 路徑
  icon          String?     // 圖標
  parentId      String?     // 父選單
  applicationId String      // ⚠️ 必須關聯 Application
  order         Int         @default(0)
  isVisible     Boolean     @default(true)
  
  application   Application @relation(...)
  parent        MenuItem?   @relation(...)
  children      MenuItem[]  @relation(...)
  
  @@unique([applicationId, name])
  @@unique([applicationId, path])
  @@index([applicationId])
  @@index([parentId])
  @@index([parentId, order])
}
```

### 2. Application 表

```prisma
model Application {
  id          String             @id @default(cuid())
  name        String             @unique
  displayName String
  description String?
  isActive    Boolean            @default(true)
  path        String             @unique
  icon        String?
  order       Int                @default(0)
  
  roles       RoleApplication[]  // 角色關聯
  menuItems   MenuItem[]         // 選單項目
}
```

### 3. RoleApplication 表

```prisma
model RoleApplication {
  id            String      @id @default(cuid())
  roleId        String
  applicationId String
  
  role          Role        @relation(...)
  application   Application @relation(...)
  
  @@unique([roleId, applicationId])
}
```

---

## ✅ 設計優點

### 1. 階層式選單支援 ⭐
```
✅ parent/children 關聯
✅ 可建立多層選單結構
✅ 支援選單樹
```

### 2. 應用程式隔離 ⭐
```
✅ 每個 MenuItem 必須屬於一個 Application
✅ 不同應用程式的選單獨立
✅ 適合多租戶架構
```

### 3. 排序與顯示控制 ⭐
```
✅ order 欄位控制排序
✅ isVisible 控制可見性
✅ 靈活的選單管理
```

### 4. 完整的索引 ⭐
```
✅ 應用程式索引
✅ 父選單索引
✅ 複合索引（parentId + order）
✅ 唯一約束確保資料完整性
```

---

## ⚠️ 設計問題與建議

### 問題 1: 缺少 MenuItem 與 Role 的直接關聯 ❌

**目前架構**：
```
User → UserRole → Role → RoleApplication → Application → MenuItem
```

**問題**：
- ❌ 無法針對**個別選單項目**設定權限
- ❌ 只能在 **Application 層級**控制存取
- ❌ 粒度太粗，不夠靈活

**影響**：
```
例如：同一個 Application 內
- Admin 可以看到 "Users" 選單
- User 只能看到 "Profile" 選單
❌ 目前無法實現此需求
```

**建議解決方案 A：新增 MenuItemRole 表** ⭐ 推薦

```prisma
model MenuItemRole {
  id         String   @id @default(cuid())
  menuItemId String
  roleId     String
  canView    Boolean  @default(true)  // 可查看
  canAccess  Boolean  @default(true)  // 可存取
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([menuItemId, roleId])
  @@index([menuItemId])
  @@index([roleId])
}
```

**優點**：
- ✅ 細粒度權限控制
- ✅ 每個選單項目可獨立設定權限
- ✅ 可區分「查看」與「存取」權限
- ✅ 向後兼容（新增表，不影響現有邏輯）

---

### 問題 2: icon 欄位設計不明確 ⚠️

**目前**：
```prisma
icon String?  // 不清楚是什麼格式
```

**問題**：
- ⚠️ 是圖標名稱？URL？還是 SVG？
- ⚠️ 沒有驗證機制

**建議解決方案**：

```prisma
model MenuItem {
  // 選項 A：使用 Lucide 圖標名稱（推薦）
  icon       String?  // 例如："LayoutDashboard", "Users", "Settings"
  
  // 選項 B：更靈活的設計
  iconType   IconType @default(LUCIDE)  // LUCIDE, URL, SVG
  iconValue  String?
}

enum IconType {
  LUCIDE   // Lucide React 圖標名稱
  URL      // 圖標 URL
  SVG      // SVG 字串
  EMOJI    // Emoji
}
```

**推薦**：選項 A（簡單且足夠）
- ✅ 使用 Lucide 圖標名稱字串
- ✅ 前端動態載入對應圖標
- ✅ 簡單且靈活

---

### 問題 3: 缺少選單類型區分 ⚠️

**目前**：
```
所有選單項目都是相同類型
```

**建議**：區分不同類型的選單項目

```prisma
model MenuItem {
  // ...existing fields
  type MenuItemType @default(LINK)  // 選單類型
}

enum MenuItemType {
  LINK       // 普通連結
  GROUP      // 分組標題（不可點擊）
  DIVIDER    // 分隔線
  EXTERNAL   // 外部連結
}
```

**優點**：
- ✅ 支援分組標題
- ✅ 支援視覺分隔
- ✅ 區分內部/外部連結

---

### 問題 4: 缺少選單項目的元數據 ⚠️

**建議新增**：

```prisma
model MenuItem {
  // ...existing fields
  description String?      // 選單項目描述（提示文字）
  badge       String?      // 徽章文字（例如："New", "3"）
  badgeColor  String?      // 徽章顏色
  isDisabled  Boolean      @default(false)  // 是否禁用
  openInNewTab Boolean     @default(false)  // 是否在新分頁開啟
  metadata    Json?        // 額外元數據（JSON）
}
```

**用途**：
- ✅ 顯示提示文字
- ✅ 顯示通知徽章（例如："3 則未讀訊息"）
- ✅ 臨時禁用選單項目
- ✅ 儲存自訂資料

---

### 問題 5: Application 與 MenuItem 的強制關聯 🤔

**目前**：
```prisma
applicationId String  // ❗ 必填
```

**問題**：
- 🤔 如果有**全域選單項目**怎麼辦？
- 🤔 例如："個人資料"、"設定" 應該在所有應用程式中都可見

**建議解決方案**：

```prisma
model MenuItem {
  applicationId String?  // ✅ 改為可選
  isGlobal      Boolean  @default(false)  // ✅ 新增全域標記
  
  // 修改唯一約束
  @@unique([applicationId, name])  // 需要調整邏輯
}
```

**或者更好的方案**：保持現狀，創建一個 "Global" Application

```sql
-- 創建全域應用程式
INSERT INTO "Application" (name, displayName, path, isActive)
VALUES ('global', 'Global', '/', true);
```

**推薦**：保持現狀 + 創建 Global Application
- ✅ 資料一致性
- ✅ 邏輯清晰
- ✅ 不需改 Schema

---

## 🎯 完整的改進建議

### 建議 A：最小改動（推薦給當前階段）⭐

**新增表**：
```prisma
model MenuItemRole {
  id         String   @id @default(cuid())
  menuItemId String
  roleId     String
  canView    Boolean  @default(true)
  canAccess  Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([menuItemId, roleId])
  @@index([menuItemId])
  @@index([roleId])
}
```

**修改 MenuItem**：
```prisma
model MenuItem {
  // ...existing fields
  
  // ✅ 新增
  description  String?           // 描述
  type         MenuItemType      @default(LINK)
  isDisabled   Boolean           @default(false)
  
  // ✅ 新增關聯
  roleAccess   MenuItemRole[]
}

enum MenuItemType {
  LINK
  GROUP
  DIVIDER
}
```

---

### 建議 B：完整優化（推薦未來版本）

```prisma
model MenuItem {
  id            String           @id @default(cuid())
  name          String
  displayName   String
  description   String?          // ✅ 新增
  path          String
  icon          String?
  iconType      IconType         @default(LUCIDE)  // ✅ 新增
  type          MenuItemType     @default(LINK)    // ✅ 新增
  parentId      String?
  applicationId String
  order         Int              @default(0)
  isVisible     Boolean          @default(true)
  isDisabled    Boolean          @default(false)  // ✅ 新增
  openInNewTab  Boolean          @default(false)  // ✅ 新增
  badge         String?          // ✅ 新增
  badgeColor    String?          // ✅ 新增
  metadata      Json?            // ✅ 新增
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  application   Application      @relation(...)
  parent        MenuItem?        @relation(...)
  children      MenuItem[]       @relation(...)
  roleAccess    MenuItemRole[]   // ✅ 新增
  
  @@unique([applicationId, name])
  @@unique([applicationId, path])
  @@index([applicationId])
  @@index([parentId])
  @@index([parentId, order])
  @@index([type])              // ✅ 新增
  @@index([isVisible, order])  // ✅ 新增
}

model MenuItemRole {
  id         String   @id @default(cuid())
  menuItemId String
  roleId     String
  canView    Boolean  @default(true)
  canAccess  Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([menuItemId, roleId])
  @@index([menuItemId])
  @@index([roleId])
  @@index([canView])
}

enum MenuItemType {
  LINK       // 普通連結
  GROUP      // 分組標題
  DIVIDER    // 分隔線
  EXTERNAL   // 外部連結
}

enum IconType {
  LUCIDE     // Lucide 圖標
  URL        // 圖標 URL
  SVG        // SVG 字串
  EMOJI      // Emoji
}
```

---

## 📋 權限控制邏輯

### 當前可用的邏輯（Application 層級）

```typescript
// 檢查用戶是否有應用程式存取權
async function hasApplicationAccess(userId: string, applicationId: string) {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: { 
      role: {
        include: {
          applications: {
            where: { applicationId }
          }
        }
      }
    }
  });
  
  return userRoles.some(ur => 
    ur.role.applications.length > 0
  );
}
```

### 建議的邏輯（MenuItem 層級）⭐

```typescript
// 取得用戶可見的選單項目
async function getUserMenuItems(userId: string, applicationId: string) {
  // 1. 取得用戶角色
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });
  
  const roleIds = userRoles.map(ur => ur.roleId);
  
  // 2. 取得選單項目（考慮權限）
  const menuItems = await db.menuItem.findMany({
    where: {
      applicationId,
      isVisible: true,
      isDisabled: false,
      OR: [
        // 沒有設定權限的選單（所有人可見）
        { roleAccess: { none: {} } },
        // 或者用戶角色有權限
        {
          roleAccess: {
            some: {
              roleId: { in: roleIds },
              canView: true
            }
          }
        }
      ]
    },
    include: {
      children: {
        where: { isVisible: true }
      }
    },
    orderBy: { order: 'asc' }
  });
  
  return menuItems;
}
```

---

## 🎯 總結與建議

### ✅ 目前設計良好的部分

1. **階層式選單** - parent/children 關聯
2. **應用程式隔離** - 適合多租戶
3. **排序與可見性** - 基本控制完善
4. **索引設計** - 查詢效能佳

### ⚠️ 需要改進的部分

| 問題 | 優先級 | 建議 |
|------|--------|------|
| 缺少選單級權限 | 🔴 高 | 新增 MenuItemRole 表 |
| icon 格式不明 | 🟡 中 | 文檔化或新增 iconType |
| 缺少選單類型 | 🟡 中 | 新增 MenuItemType enum |
| 缺少元數據 | 🟢 低 | 新增 description、badge 等欄位 |

### 🚀 實作建議

**階段 1：立即實作（本週）**
1. ✅ 新增 `MenuItemRole` 表
2. ✅ 更新 MenuItem 模型（description, type, isDisabled）
3. ✅ 建立選單查詢函數

**階段 2：短期實作（2週內）**
1. ✅ 實作動態選單載入
2. ✅ 實作權限過濾
3. ✅ 建立選單管理介面

**階段 3：中期優化（1個月內）**
1. ✅ 新增完整元數據支援
2. ✅ 新增 iconType 支援
3. ✅ 實作選單快取機制

---

## 💡 我的建議

**立即採用「建議 A：最小改動」**

**原因**：
1. ✅ 解決最關鍵的權限控制問題
2. ✅ 改動最小，風險低
3. ✅ 向後兼容
4. ✅ 可以立即實作並投入使用

**下一步**：
我可以立即為您：
1. 生成 Prisma migration
2. 建立選單查詢函數
3. 更新 Dashboard 使用動態選單
4. 創建選單管理介面（可選）

---

**需要我開始實作嗎？**
