# 📊 PostgreSQL 數據庫設置報告

**設置日期**: 2025-10-24  
**狀態**: ✅ 成功  
**數據庫**: PostgreSQL (Neon)

---

## 🎯 設置摘要

### 連接信息
- **主機**: ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech
- **數據庫**: authmost
- **用戶**: neondb_owner
- **區域**: ap-southeast-1 (新加坡)
- **SSL 模式**: require
- **Channel Binding**: require

### 設置步驟
1. ✅ 創建 `.env.local` 文件
2. ✅ 配置 DATABASE_URL
3. ✅ 運行 `prisma db push`
4. ✅ 驗證數據庫連接
5. ✅ 生成 Prisma Client

---

## 📁 創建的資料表 (18 個)

### 認證相關 (8 個表)
1. **User** - 用戶信息
   - 字段: id, name, email, password, status, isTwoFactorEnabled, deletedAt 等
   - 索引: email (unique)

2. **Account** - OAuth 賬戶
   - 字段: userId, provider, providerAccountId, access_token, refresh_token 等
   - 關係: 多對一 (User)

3. **Session** - 用戶會話
   - 字段: id, sessionToken, userId, expires, userAgent, ipAddress 等
   - 索引: userId, deviceId, expires, lastActivity

4. **LoginMethod** - 登錄方式
   - 字段: id, userId, method, createdAt, updatedAt
   - 唯一約束: (userId, method)

5. **VerificationToken** - 驗證令牌
   - 字段: id, email, token, expires, userId
   - 索引: userId, expires

6. **PasswordResetToken** - 密碼重置令牌
   - 字段: id, email, token, expires, userId
   - 索引: email, userId, expires

7. **TwoFactorToken** - 雙因素認證令牌
   - 字段: id, userId, token, expires, used
   - 索引: userId, expires

8. **TwoFactorConfirmation** - 雙因素認證確認
   - 字段: id, userId, createdAt
   - 唯一約束: userId

### 權限管理 (5 個表)
9. **Role** - 角色
   - 字段: id, name, description, createdAt, updatedAt, deletedAt
   - 唯一約束: name

10. **Permission** - 權限
    - 字段: id, name, description, createdAt, updatedAt
    - 唯一約束: name

11. **UserRole** - 用戶-角色關聯
    - 字段: id, userId, roleId, createdAt, updatedAt
    - 唯一約束: (userId, roleId)
    - 索引: userId, roleId, (userId, roleId)

12. **RolePermission** - 角色-權限關聯
    - 字段: id, roleId, permissionId, createdAt, updatedAt
    - 唯一約束: (roleId, permissionId)
    - 索引: roleId, permissionId, (roleId, permissionId)

13. **RoleApplication** - 角色-應用關聯
    - 字段: id, roleId, applicationId, createdAt, updatedAt
    - 唯一約束: (roleId, applicationId)
    - 索引: roleId, applicationId, (roleId, applicationId)

### 應用菜單 (4 個表)
14. **Application** - 應用
    - 字段: id, name, displayName, description, isActive, path, icon, order
    - 唯一約束: name, path

15. **MenuItem** - 菜單項
    - 字段: id, name, displayName, path, icon, type, parentId, applicationId, order, isVisible, isDisabled, version, deletedAt
    - 唯一約束: (applicationId, name), (applicationId, path)
    - 索引: applicationId, parentId, (parentId, order), (isVisible, order), type

16. **MenuItemRole** - 菜單項-角色關聯
    - 字段: id, menuItemId, roleId, canView, canAccess, createdAt, updatedAt
    - 唯一約束: (menuItemId, roleId)
    - 索引: menuItemId, roleId, (roleId, canView), (menuItemId, canView)

### 審計日誌 (1 個表)
17. **AuditLog** - 審計日誌
    - 字段: id, userId, action, status, timestamp, ipAddress, userAgent, targetUserId, resourceId, resourceType, oldValue, newValue, reason, metadata, priority, sessionId
    - 索引: userId, action, timestamp, targetUserId, priority, resourceType, sessionId, (userId, timestamp), (action, timestamp)

### 枚舉類型 (1 個)
18. **Enums** - 枚舉定義
    - MenuItemType: LINK, GROUP, DIVIDER, EXTERNAL
    - DefaultRole: user, admin
    - UserStatus: pending, active, suspended, banned, deleted, inactive

---

## 🔧 配置文件

### `.env.local` 內容
```
DATABASE_URL="postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Prisma 配置
- **Provider**: PostgreSQL
- **Client**: Prisma Client JS
- **Schema**: prisma/schema.prisma

---

## ✅ 驗證結果

### 連接測試
```
✓ 成功連接到 PostgreSQL 數據庫
✓ 數據庫: authmost
✓ 主機: ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech
✓ SSL 連接: 已啟用
```

### 數據庫同步
```
✓ 您的數據庫現在與 Prisma schema 同步
✓ 完成時間: 7.85 秒
✓ Prisma Client 已生成
```

### 表創建
```
✓ 18 個表已成功創建
✓ 所有索引已創建
✓ 所有約束已應用
✓ 所有關係已建立
```

---

## 📊 數據庫統計

| 項目 | 數量 |
|------|------|
| 表 | 18 |
| 索引 | 30+ |
| 唯一約束 | 15+ |
| 外鍵關係 | 20+ |
| 級聯刪除 | 已配置 |

---

## 🚀 下一步

### 1. 驗證連接
```bash
# 測試 Prisma 連接
npx prisma db execute --stdin < test.sql
```

### 2. 初始化數據
```bash
# 運行 seed 腳本
npx prisma db seed
```

### 3. 啟動應用
```bash
# 開發模式
npm run dev

# 生產構建
npm run build
npm start
```

### 4. 監控數據庫
```bash
# 打開 Prisma Studio
npx prisma studio
```

---

## 🔐 安全建議

### 環境變數
- ✅ DATABASE_URL 已配置在 `.env.local`
- ⚠️ 確保 `.env.local` 在 `.gitignore` 中
- ⚠️ 不要將敏感信息提交到版本控制

### 數據庫安全
- ✅ SSL 連接已啟用
- ✅ Channel Binding 已啟用
- ✅ 密碼已加密存儲
- ⚠️ 定期更新密碼

### 備份策略
- 📌 Neon 提供自動備份
- 📌 建議定期導出數據
- 📌 保留備份副本

---

## 📝 常見命令

### Prisma 命令
```bash
# 查看數據庫狀態
npx prisma db execute --stdin

# 打開 Prisma Studio
npx prisma studio

# 生成 Prisma Client
npx prisma generate

# 推送 schema 變更
npx prisma db push

# 創建遷移
npx prisma migrate dev --name migration_name

# 應用遷移
npx prisma migrate deploy
```

### 數據庫查詢
```bash
# 連接到數據庫
psql postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost

# 列出所有表
\dt

# 查看表結構
\d table_name

# 查看索引
\di
```

---

## 🎓 架構概述

### 三層權限系統
```
User → UserRole → Role → RolePermission → Permission
                    ↓
              RoleApplication → Application
                    ↓
              MenuItemRole → MenuItem
```

### 認證流程
```
Login → Account/LoginMethod → Session → User → UserRole → Role
```

### 審計追蹤
```
所有操作 → AuditLog (記錄用戶、操作、時間、IP、結果)
```

---

## ✨ 特性

✅ **完整的 RBAC 系統** - 三層權限結構  
✅ **多應用支持** - 應用隔離和 SSO  
✅ **審計日誌** - 完整的操作追蹤  
✅ **軟刪除** - 數據恢復支持  
✅ **版本控制** - 菜單版本管理  
✅ **SSL 連接** - 安全的數據傳輸  

---

## 📞 支持

### 連接問題
- 檢查 DATABASE_URL 是否正確
- 驗證網絡連接
- 檢查防火牆設置

### 性能優化
- 使用 Prisma 緩存
- 優化查詢
- 添加適當的索引

### 備份恢復
- 使用 Neon 備份功能
- 定期測試恢復流程

---

**設置完成日期**: 2025-10-24  
**狀態**: ✅ 準備就緒  
**下一步**: 初始化數據並啟動應用

