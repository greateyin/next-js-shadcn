# User Role Assignment Audit Report

**Date:** 2025-10-26  
**Status:** ⚠️ CRITICAL ISSUES FOUND  
**Priority:** HIGH

---

## Executive Summary

用戶首次使用 OAuth 或 email 註冊後的角色分配存在**多個關鍵問題**：

| 場景 | 狀態 | 問題 |
|------|------|------|
| OAuth 登錄 | ✅ 部分正常 | 僅在首次登錄時分配，後續登錄不檢查 |
| Email 註冊 | ❌ **缺失** | 驗證後未分配任何角色 |
| 代碼中的角色字段 | ❌ **無效** | 使用不存在的 `role` 字段 |

---

## 問題 1: Email 註冊後缺少角色分配

### 現象
1. 用戶通過 email 註冊
2. 驗證 email 後，用戶狀態變為 `active`
3. **但沒有分配任何角色** ❌

### 代碼分析

**註冊流程 (`actions/auth/registration.ts`):**
```typescript
// 第 61-67 行
await db.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
    // ❌ 沒有分配角色
  },
});
```

**Email 驗證流程 (`app/api/auth/verify/route.ts`):**
```typescript
// 第 141-153 行
const updatedUser = await db.user.update({
  where: { id: user.id },
  data: { 
    emailVerified: new Date(),
    status: 'active' as const
  },
  // ❌ 沒有分配角色
});
```

### 影響
- Email 註冊用戶驗證後無法訪問任何功能
- 根據新的安全改進，無角色用戶會被拒絕訪問
- 用戶會看到 "Unauthorized" 錯誤

---

## 問題 2: 代碼中使用無效的 `role` 字段

### 現象
多個文件嘗試使用不存在的 `role` 字段

### 位置 1: `app/auth/register/actions.ts`

```typescript
// 第 68-76 行 - ❌ 無效
const user = await db.user.create({
  data: {
    email: data.email,
    password: hashedPassword,
    name: data.name,
    role: "user",  // ❌ User 模型沒有 role 字段！
    status: "pending",
  }
});
```

### 位置 2: `actions/auth/registration.ts`

```typescript
// 第 61-67 行 - ❌ 無效
await db.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
    // ❌ 沒有分配角色（但至少沒有嘗試使用無效字段）
  },
});
```

### 數據庫模型 (正確)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // ✅ NO scalar role field
  userRoles UserRole[]  // 角色通過 join table 存儲
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  user      User     @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])
}
```

---

## 問題 3: OAuth 登錄的角色分配不完整

### 現象
OAuth 用戶在首次登錄時分配角色，但後續登錄不檢查

### 代碼分析 (`auth.config.ts` 第 202-245 行)

```typescript
async signIn({ user, account }) {
  if (account?.provider !== "credentials") {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        include: { userRoles: true }
      });

      // ✅ 檢查用戶狀態
      if (existingUser && existingUser.status !== 'active' && existingUser.status !== 'pending') {
        return false;
      }

      // ✅ 如果用戶沒有角色，分配 'user' 角色
      if (existingUser && existingUser.userRoles.length === 0) {
        // 分配角色...
      }
    } catch (error) {
      // 繼續登錄
    }
  }
  return true;
}
```

### 問題
- 只在 `userRoles.length === 0` 時分配角色
- 如果角色查詢失敗，會被 catch 吞掉，用戶仍然登錄成功
- 沒有驗證角色是否真的被分配成功

---

## 修復方案

### 修復 1: Email 驗證後分配角色

**文件:** `app/api/auth/verify/route.ts`

```typescript
// 在更新用戶狀態後，分配 'user' 角色
const userRole = await db.role.findUnique({
  where: { name: "user" }
});

if (userRole) {
  await db.userRole.create({
    data: {
      userId: user.id,
      roleId: userRole.id
    }
  });
}
```

### 修復 2: 移除無效的 `role` 字段

**文件:** `app/auth/register/actions.ts`

```typescript
// 移除 role 字段
const user = await db.user.create({
  data: {
    email: data.email,
    password: hashedPassword,
    name: data.name,
    status: "pending",
    // ✅ 不設置 role 字段
  }
});
```

### 修復 3: 改進 OAuth 角色分配

**文件:** `auth.config.ts`

```typescript
// 添加事務以確保角色分配成功
await db.$transaction(async (tx) => {
  // 更新用戶狀態
  await tx.user.update({
    where: { id: existingUser.id },
    data: { status: "active", emailVerified: new Date() }
  });

  // 分配角色
  const userRole = await tx.role.findUnique({
    where: { name: "user" }
  });

  if (userRole) {
    await tx.userRole.create({
      data: { userId: existingUser.id, roleId: userRole.id }
    });
  }
});
```

---

## 驗證清單

- [ ] Email 驗證後自動分配 'user' 角色
- [ ] 移除 `app/auth/register/actions.ts` 中的無效 `role` 字段
- [ ] 改進 OAuth 角色分配的錯誤處理
- [ ] 測試 email 註冊流程
- [ ] 測試 OAuth 登錄流程
- [ ] 驗證新用戶有正確的角色

---

## 測試步驟

### 測試 1: Email 註冊
```bash
1. 訪問 /auth/register
2. 輸入 email 和密碼
3. 驗證 email
4. 登錄
5. 驗證用戶有 'user' 角色
```

### 測試 2: OAuth 登錄
```bash
1. 點擊 "Sign in with Google/GitHub"
2. 完成 OAuth 流程
3. 驗證用戶有 'user' 角色
4. 再次登錄
5. 驗證角色仍然存在
```

---

## 影響範圍

- **Email 註冊用戶:** 無法訪問任何功能 ❌
- **OAuth 用戶:** 首次登錄正常，但如果角色被刪除會有問題 ⚠️
- **系統安全:** 無角色用戶會被拒絕訪問 ✅

---

**Last Updated:** 2025-10-26

