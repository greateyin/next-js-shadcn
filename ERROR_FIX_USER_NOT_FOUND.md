# 🔧 錯誤修復：User Not Found

## 📅 修復日期：2025-10-04

---

## ❌ 錯誤描述

```
Error: User with ID cmgavwkmy001k1839tnhdfsvv not found
at getUserRolesAndPermissions (lib/auth/roleService.ts:36:11)
```

**錯誤原因**：
- Session 中的 user ID 在資料庫中不存在
- 可能因為資料庫重置、清空或 session 過期

---

## ✅ 修復內容

### 1. Admin Layout 錯誤處理

**檔案**：`app/admin/layout.tsx`

**修改前**：
```typescript
// 直接調用，如果用戶不存在會拋出錯誤
const userRolesAndPermissions = await getUserRolesAndPermissions(session.user.id);
```

**修改後**：
```typescript
// 添加 try-catch 錯誤處理
let userRolesAndPermissions;
try {
  userRolesAndPermissions = await getUserRolesAndPermissions(session.user.id);
} catch (error) {
  console.error("Error fetching user roles:", error);
  // 重定向到登入頁面並帶上錯誤訊息
  redirect("/auth/login?error=UserNotFound");
}
```

### 2. Dashboard Page 錯誤處理

**檔案**：`app/dashboard/page.tsx`

**修改前**：
```typescript
const menuItems = await getUserMenuItems(session.user.id);
```

**修改後**：
```typescript
let menuItems: MenuItemWithChildren[] = [];
try {
  menuItems = await getUserMenuItems(session.user.id);
} catch (error) {
  console.error("Error fetching menu items:", error);
  redirect("/auth/login?error=UserNotFound&callbackUrl=/dashboard");
}
```

### 3. Dashboard Profile Page 錯誤處理

**檔案**：`app/dashboard/profile/page.tsx`

**修改前**：
```typescript
const menuItems = await getUserMenuItems(session.user.id);
```

**修改後**：
```typescript
let menuItems: MenuItemWithChildren[] = [];
try {
  menuItems = await getUserMenuItems(session.user.id);
} catch (error) {
  console.error("Error fetching menu items:", error);
  // 繼續執行，但使用空選單
}
```

### 4. TypeScript 類型修正

**問題**：`menuItems` 隱式 `any[]` 類型

**修正**：
```typescript
// 添加明確類型註解
import { getUserMenuItems, type MenuItemWithChildren } from "@/lib/menu";

let menuItems: MenuItemWithChildren[] = [];
```

---

## 🎯 修復效果

### Before（修復前）
```
❌ 應用程式崩潰
❌ 顯示錯誤頁面
❌ 用戶無法繼續使用
```

### After（修復後）
```
✅ 捕獲錯誤
✅ 記錄到控制台
✅ 優雅地重定向到登入頁面
✅ 顯示友善的錯誤訊息
```

---

## 🔍 根本原因分析

### 可能的原因

1. **資料庫重置**
   - 資料庫被清空或重新初始化
   - 但 session 仍然保存舊的 user ID

2. **Session 不同步**
   - Session 中的 ID 與資料庫不匹配
   - 可能是開發時頻繁重置資料庫

3. **用戶被刪除**
   - 用戶帳號被刪除
   - 但 session 尚未失效

### 建議的長期解決方案

#### 方案 1：Session 驗證中間件

```typescript
// middleware.ts 或 auth.ts
async function validateSession(session: Session) {
  if (!session?.user?.id) return null;
  
  // 驗證用戶是否存在
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  });
  
  if (!user) {
    // 用戶不存在，清除 session
    return null;
  }
  
  return session;
}
```

#### 方案 2：Auth.js Callbacks

```typescript
// auth.ts
export const { auth, handlers } = NextAuth({
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        // 驗證用戶是否存在
        const user = await db.user.findUnique({
          where: { id: token.sub },
          select: { id: true }
        });
        
        if (!user) {
          // 用戶不存在，返回 null 終止 session
          return null;
        }
        
        session.user.id = token.sub;
      }
      return session;
    }
  }
});
```

#### 方案 3：定期清理過期 Session

```typescript
// lib/session-cleanup.ts
export async function cleanupExpiredSessions() {
  // 刪除已過期的 sessions
  await db.session.deleteMany({
    where: {
      expires: {
        lt: new Date()
      }
    }
  });
  
  // 刪除用戶不存在的 sessions
  await db.$executeRaw`
    DELETE FROM "Session" s
    WHERE NOT EXISTS (
      SELECT 1 FROM "User" u WHERE u.id = s."userId"
    )
  `;
}
```

---

## 🧪 測試步驟

### 測試場景 1：正常用戶

```bash
1. 使用有效帳號登入
2. 訪問 /dashboard
3. 訪問 /admin
```

**預期結果**：✅ 正常顯示

### 測試場景 2：用戶不存在

```bash
1. 手動修改 session 的 user ID 為不存在的 ID
2. 訪問 /dashboard
```

**預期結果**：
- ✅ 捕獲錯誤
- ✅ 記錄到控制台
- ✅ 重定向到 /auth/login?error=UserNotFound

### 測試場景 3：資料庫重置

```bash
1. 登入成功
2. 重置資料庫（npx prisma db push --force-reset）
3. 不登出，直接訪問 /dashboard
```

**預期結果**：
- ✅ 不會崩潰
- ✅ 優雅地處理錯誤
- ✅ 重定向到登入頁面

---

## 📝 開發建議

### 開發階段

1. **頻繁重置資料庫時**
   ```bash
   # 清除 session
   - 手動清除瀏覽器 cookies
   - 或使用無痕模式測試
   ```

2. **使用 Seed 腳本**
   ```bash
   npx prisma db push --force-reset
   npx tsx prisma/seed.ts
   npx tsx prisma/seed-menu.ts
   ```

3. **監控控制台**
   - 檢查 "Error fetching" 訊息
   - 確認錯誤處理是否正常工作

### 生產環境

1. **實作 Session 驗證**
   - 在 auth callback 中驗證用戶存在
   - 定期清理無效 session

2. **監控錯誤**
   - 使用 Sentry 或類似工具
   - 追蹤 UserNotFound 錯誤頻率

3. **友善的錯誤頁面**
   - 顯示清晰的錯誤訊息
   - 提供返回登入的連結

---

## ✅ 檢查清單

修復完成後驗證：

- [x] Admin Layout 有錯誤處理
- [x] Dashboard Page 有錯誤處理
- [x] Dashboard Profile Page 有錯誤處理
- [x] TypeScript 類型正確
- [x] 錯誤記錄到控制台
- [x] 優雅的錯誤重定向
- [x] 用戶體驗改善

---

## 📚 相關檔案

**修改檔案**：
- ✅ `app/admin/layout.tsx`
- ✅ `app/dashboard/page.tsx`
- ✅ `app/dashboard/profile/page.tsx`

**未修改但相關**：
- `lib/auth/roleService.ts` - 拋出錯誤的源頭
- `lib/menu.ts` - 查詢選單的函數

---

## 🎉 總結

### 修復成果

1. **錯誤處理**：添加 try-catch 捕獲錯誤
2. **用戶體驗**：優雅的錯誤處理，不會崩潰
3. **類型安全**：修正 TypeScript 類型錯誤
4. **可維護性**：清晰的錯誤日誌

### 下一步建議

1. 考慮實作 Session 驗證中間件
2. 在 Auth.js callbacks 中添加用戶存在檢查
3. 實作定期 session 清理
4. 添加更友善的錯誤頁面

---

**修復完成！應用程式現在可以優雅地處理用戶不存在的情況。** ✨
