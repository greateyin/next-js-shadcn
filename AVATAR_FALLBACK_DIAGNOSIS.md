# Avatar Fallback 問題診斷報告

**日期：** 2025-10-26  
**問題：** Dashboard 頁面右上角用戶圓心顯示 "U" 而非 "AU"  
**狀態：** 🔍 **診斷中 - 已添加調試日誌**

---

## 📋 問題描述

使用 `admin@example.com` 登入後：
- ✅ 成功登入並重定向到 `/admin`
- ✅ Admin Panel 正常工作
- ✅ 點擊 Dashboard 按鈕導航到 `/dashboard`
- ❌ **用戶圓心顯示 "U" 而非 "AU"**

---

## 🔍 詳細分析

### 代碼流程

#### 1. Avatar Fallback 邏輯（dashboard-nav.tsx 第 182-189 行）

```typescript
<AvatarFallback>
  {user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.charAt(0)?.toUpperCase() || "U"}
</AvatarFallback>
```

**邏輯分析：**
- 如果 `user?.name` 存在 → 取所有單詞的首字母 → 大寫
- 如果 `user?.name` 不存在 → 取 email 的第一個字符 → 大寫
- 如果都不存在 → 返回 "U"

**當前結果：** 顯示 "U"

**這意味著：**
- ❌ `user?.name` 為 `null` 或 `undefined`
- ❌ `user?.email` 也為 `null` 或 `undefined`

### 2. 預期的數據流

#### 數據庫層（prisma/seed.ts 第 269-279 行）

```typescript
const adminUser = await prisma.user.upsert({
  where: { email: 'admin@example.com' },
  update: {},
  create: {
    email: 'admin@example.com',
    name: 'Admin User',  // ✅ 應該有 name
    password: await hashPassword('Admin@123'),
    emailVerified: new Date(),
    status: 'active'
  }
})
```

**預期：** 數據庫中 `admin@example.com` 應該有 `name: 'Admin User'`

#### JWT 回調層（auth.config.ts 第 267-284 行）

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.status = user.status;
    token.email = user.email;
    token.name = user.name ?? null;  // ✅ 應該設置 token.name
    token.picture = user.image ?? null;
    // ...
  }
}
```

**預期：** JWT token 應該包含 `name: 'Admin User'`

#### Session 回調層（auth.config.ts 第 334-351 行）

```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id as string;
    session.user.status = token.status as UserStatus;
    session.user.email = token.email as string;
    session.user.name = token.name ?? null;  // ✅ 應該設置 session.user.name
    session.user.image = token.picture ?? null;
    // ...
  }
}
```

**預期：** Session 應該包含 `user.name: 'Admin User'`

#### 前端層（dashboard-nav.tsx 第 34-36 行）

```typescript
const { data: session } = useSession();
const user = session?.user;
```

**預期：** `user.name` 應該是 `'Admin User'`

---

## 🧪 診斷步驟

### 已添加的調試日誌

#### 1. JWT 回調日誌（auth.config.ts）

```typescript
console.log('[JWT_CALLBACK] User data:', {
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
});
```

**位置：** 第 275-280 行

#### 2. Session 回調日誌（auth.config.ts）

```typescript
console.log('[SESSION_CALLBACK] Session user data:', {
  id: session.user.id,
  email: session.user.email,
  name: session.user.name,
  image: session.user.image,
});
```

**位置：** 第 341-346 行

#### 3. DashboardNav 日誌（dashboard-nav.tsx）

```typescript
useEffect(() => {
  if (user) {
    console.log('[DashboardNav] User data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      nameLength: user.name?.length,
      emailLength: user.email?.length,
    });
  }
}, [user]);
```

**位置：** 第 43-55 行

---

## 📊 可能的根本原因

### 假設 1: 數據庫中 name 為空

**症狀：** JWT 回調中 `user.name` 為 `null`

**驗證方法：**
```bash
# 檢查數據庫中 admin@example.com 的 name 字段
npx prisma studio
# 查看 User 表，找到 admin@example.com 記錄
# 檢查 name 字段是否為空
```

**修復方法：**
```sql
UPDATE "User" SET name = 'Admin User' WHERE email = 'admin@example.com';
```

### 假設 2: JWT 回調沒有正確執行

**症狀：** JWT 回調中 `user` 參數為 `null` 或不完整

**驗證方法：** 檢查 JWT 回調日誌

**修復方法：** 確保 JWT 回調正確處理用戶數據

### 假設 3: Session 回調沒有正確執行

**症狀：** Session 回調中 `token.name` 為 `null`

**驗證方法：** 檢查 Session 回調日誌

**修復方法：** 確保 Session 回調正確傳遞 token 數據

### 假設 4: useSession() 返回不完整的數據

**症狀：** DashboardNav 中 `user.name` 為 `null`

**驗證方法：** 檢查 DashboardNav 日誌

**修復方法：** 強制刷新 session 或重新登入

---

## 🔧 後續步驟

### 1. 檢查生產日誌

訪問 Vercel 日誌，查看以下日誌：
- `[JWT_CALLBACK] User data:`
- `[SESSION_CALLBACK] Session user data:`
- `[DashboardNav] User data:`

### 2. 根據日誌診斷

根據日誌輸出確定問題所在：
- 如果 JWT 回調中 `name` 為 `null` → 問題在數據庫
- 如果 Session 回調中 `name` 為 `null` → 問題在 JWT 回調
- 如果 DashboardNav 中 `name` 為 `null` → 問題在 Session 回調

### 3. 應用修復

根據診斷結果應用相應的修復

---

## 📝 相關文件

- `components/dashboard/dashboard-nav.tsx` - Avatar Fallback 邏輯
- `auth.config.ts` - JWT 和 Session 回調
- `prisma/seed.ts` - 用戶數據創建
- `prisma/schema.prisma` - User 模型定義

---

## ✅ 驗證清單

- [x] 添加 JWT 回調日誌
- [x] 添加 Session 回調日誌
- [x] 添加 DashboardNav 日誌
- [ ] 檢查生產日誌
- [ ] 確定根本原因
- [ ] 應用修復
- [ ] 驗證修復成功

---

**最後更新：** 2025-10-26 13:25 UTC+8  
**下一步：** 檢查生產日誌並根據日誌輸出診斷問題

