# 🚀 PostgreSQL 數據庫快速開始指南

**設置日期**: 2025-10-24  
**狀態**: ✅ 已完成

---

## 📋 快速檢查清單

- [x] 創建 `.env.local` 文件
- [x] 配置 DATABASE_URL
- [x] 運行 `prisma db push`
- [x] 驗證數據庫連接
- [x] 生成 Prisma Client
- [x] 創建 18 個資料表

---

## 🔗 連接信息

```
主機: ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech
數據庫: authmost
用戶: neondb_owner
密碼: npg_gVca5Gvpy9AJ
區域: ap-southeast-1 (新加坡)
SSL: 已啟用
```

---

## 📁 創建的資料表

### 認證 (8 個表)
- User, Account, Session, LoginMethod
- VerificationToken, PasswordResetToken, TwoFactorToken, TwoFactorConfirmation

### 權限 (5 個表)
- Role, Permission, UserRole, RolePermission, RoleApplication

### 應用菜單 (4 個表)
- Application, MenuItem, MenuItemRole

### 審計 (1 個表)
- AuditLog

---

## 🎯 常用命令

### 開發
```bash
# 啟動開發服務器
npm run dev

# 打開 Prisma Studio (數據庫管理)
npx prisma studio

# 查看數據庫狀態
npx prisma db execute --stdin
```

### 遷移
```bash
# 推送 schema 變更
npx prisma db push

# 創建新遷移
npx prisma migrate dev --name migration_name

# 應用遷移
npx prisma migrate deploy
```

### 生成
```bash
# 重新生成 Prisma Client
npx prisma generate

# 清理並重新生成
rm -rf node_modules/.prisma && npx prisma generate
```

---

## 🔐 環境變數

### `.env.local` 文件位置
```
c:\Users\dennis_yin\Desktop\GitHub\next-js-shadcn\.env.local
```

### 必需變數
```
DATABASE_URL=postgresql://neondb_owner:npg_gVca5Gvpy9AJ@...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 可選變數
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## 📊 數據庫架構

### 權限系統
```
User
  ├─ UserRole
  │   └─ Role
  │       ├─ RolePermission → Permission
  │       ├─ RoleApplication → Application
  │       └─ MenuItemRole → MenuItem
  ├─ Account (OAuth)
  ├─ Session
  └─ AuditLog
```

### 菜單系統
```
Application
  └─ MenuItem (支持層級)
      └─ MenuItemRole
          └─ Role
```

---

## ✅ 驗證步驟

### 1. 檢查連接
```bash
$env:DATABASE_URL="postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost?sslmode=require&channel_binding=require"
npx prisma db execute --stdin
```

### 2. 查看表
```bash
npx prisma studio
# 打開瀏覽器訪問 http://localhost:5555
```

### 3. 測試查詢
```typescript
import { prisma } from '@/lib/prisma'

// 查詢用戶
const users = await prisma.user.findMany()

// 查詢角色
const roles = await prisma.role.findMany()

// 查詢菜單
const menus = await prisma.menuItem.findMany()
```

---

## 🚀 啟動應用

### 第一次運行
```bash
# 1. 安裝依賴
npm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 啟動開發服務器
npm run dev

# 4. 打開瀏覽器
# http://localhost:3000
```

### 後續運行
```bash
# 直接啟動
npm run dev
```

---

## 🔧 故障排除

### 連接失敗
```
❌ 錯誤: 無法連接到數據庫
✅ 解決: 檢查 DATABASE_URL 是否正確
✅ 解決: 檢查網絡連接
✅ 解決: 檢查防火牆設置
```

### Prisma Client 錯誤
```
❌ 錯誤: @prisma/client did not initialize
✅ 解決: 運行 npx prisma generate
✅ 解決: 刪除 node_modules/.prisma
✅ 解決: 重新安裝依賴
```

### 遷移失敗
```
❌ 錯誤: 遷移失敗
✅ 解決: 檢查 schema.prisma 語法
✅ 解決: 運行 npx prisma db push
✅ 解決: 查看詳細錯誤信息
```

---

## 📚 相關文檔

- **DATABASE_SETUP_REPORT.md** - 詳細設置報告
- **prisma/schema.prisma** - 數據庫 schema 定義
- **FINAL_SUMMARY.md** - 項目完成總結

---

## 🎓 學習資源

### Prisma 文檔
- [Prisma 官方文檔](https://www.prisma.io/docs/)
- [Prisma CLI 命令](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Prisma Schema](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### PostgreSQL 文檔
- [PostgreSQL 官方文檔](https://www.postgresql.org/docs/)
- [Neon 文檔](https://neon.tech/docs/)

### Next.js 文檔
- [Next.js 官方文檔](https://nextjs.org/docs)
- [Next.js 數據庫集成](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

## 💡 最佳實踐

### 1. 環境變數
- ✅ 使用 `.env.local` 存儲敏感信息
- ✅ 添加 `.env.local` 到 `.gitignore`
- ✅ 不要提交密碼到版本控制

### 2. 數據庫操作
- ✅ 使用 Prisma Client 進行查詢
- ✅ 使用事務進行多步驟操作
- ✅ 添加適當的錯誤處理

### 3. 性能優化
- ✅ 使用 Prisma 緩存
- ✅ 優化查詢 (select, include, where)
- ✅ 添加適當的索引

### 4. 安全性
- ✅ 驗證用戶輸入
- ✅ 使用參數化查詢
- ✅ 記錄審計日誌

---

## 📞 需要幫助？

### 檢查日誌
```bash
# 查看應用日誌
npm run dev

# 查看 Prisma 日誌
DEBUG=prisma:* npm run dev
```

### 重置數據庫
```bash
# 警告: 這將刪除所有數據
npx prisma migrate reset

# 或使用 db push 重新同步
npx prisma db push --force-reset
```

### 備份數據
```bash
# 使用 Neon 備份功能
# 登錄 Neon 控制面板進行備份
```

---

**快速開始完成！** 🎉

現在您可以開始開發您的應用了。祝您編碼愉快！

