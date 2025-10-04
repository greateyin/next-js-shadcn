# Auth.js V5 全面重構總結

## 📋 重構概述

本次重構將所有認證相關程式碼全面升級為 Auth.js V5 最佳實踐，包括登入、登出、社交登入等功能。

---

## ✅ 已完成的重構

### 1. **登入功能** (Login)

#### Server Actions
- ✅ `actions/auth/login.ts` - 創建了符合 Auth.js V5 的 Server Actions
  - `loginAction()` - 標準登入
  - `loginWithRedirectAction()` - 支援自訂重定向的登入
  - `logoutAction()` - 登出功能

#### 組件
- ✅ `components/auth/login-form.tsx` - 改用 Server Actions 實現
  - 使用 `useActionState` (React 19) 和 `useFormStatus` hooks
  - 移除客戶端 `signIn()` 調用
  - 自動處理重定向

### 2. **登出功能** (Logout)

#### Server Actions
- ✅ `logoutAction()` 在 `actions/auth/login.ts`
  - 伺服器端 session 無效化
  - 自動重定向處理

#### 組件
- ✅ `components/auth/logout-button.tsx` - 改用 Server Actions
  - 使用 `useTransition` hook
  - 移除客戶端 `signOut()` from `next-auth/react`
  - 支援自訂重定向 URL

### 3. **社交登入** (OAuth)

#### 組件
- ✅ `components/auth/social-buttons.tsx` - 優化並加入文檔
  - 保持使用客戶端 `signIn()` (OAuth 必須)
  - 加入詳細註解說明為何 OAuth 必須使用客戶端方式
  - 支援 callbackUrl 查詢參數
  - 改善載入狀態管理

### 4. **註冊功能** (Registration)

#### Server Actions
- ✅ `actions/auth/registration.ts` - 已存在且正確實現
  - 使用 Server Actions
  - 密碼哈希處理
  - 電子郵件驗證

#### 組件
- ✅ `components/auth/register-form.tsx` - 已使用 Server Actions
  - 使用 `react-hook-form` 和 Zod 驗證
  - 正確調用 `registerAction`

---

## 🔑 Auth.js V5 最佳實踐原則

### Credentials 認證 (Email/Password)
```tsx
// ✅ 正確：使用 Server Actions
export async function loginAction(formData: FormData) {
  await signIn("credentials", {
    email,
    password,
    redirectTo: DEFAULT_LOGIN_REDIRECT,
  });
}

// 在組件中
<form action={loginAction}>
  <input name="email" />
  <input name="password" />
  <button type="submit">Login</button>
</form>
```

```tsx
// ❌ 錯誤：客戶端 signIn (舊版)
const response = await signIn("credentials", {
  email,
  password,
  redirect: false,
});
window.location.href = nextUrl; // 手動重定向
```

### OAuth 認證 (Google/GitHub)
```tsx
// ✅ 正確：必須使用客戶端 signIn
"use client";
import { signIn } from "next-auth/react";

await signIn("google", {
  callbackUrl: DEFAULT_LOGIN_REDIRECT,
});
```

**為何 OAuth 必須使用客戶端？**
1. OAuth 需要瀏覽器重定向到提供商網站
2. 提供商需要重定向回我們的 callback URL
3. 這與 credentials 認證不同

### 登出功能
```tsx
// ✅ 正確：使用 Server Actions
export async function logoutAction(redirectTo: string = "/") {
  await signOut({ redirectTo });
}

// 在組件中使用 useTransition
const [isPending, startTransition] = useTransition();
startTransition(async () => {
  await logoutAction("/");
});
```

```tsx
// ❌ 錯誤：客戶端 signOut (舊版)
import { signOut } from "next-auth/react";
await signOut({ callbackUrl: "/" });
```

---

## 📁 文件結構

### 主要文件（已重構）

```
actions/auth/
├── login.ts              ✅ 登入/登出 Server Actions
├── registration.ts       ✅ 註冊 Server Actions
├── password-reset.ts     ✅ 密碼重置
├── two-factor.ts         ✅ 雙因素認證
├── verification.ts       ✅ 電子郵件驗證
└── index.ts             ✅ 統一匯出

components/auth/
├── login-form.tsx        ✅ 登入表單 (使用 Server Actions)
├── register-form.tsx     ✅ 註冊表單 (使用 Server Actions)
├── logout-button.tsx     ✅ 登出按鈕 (使用 Server Actions)
└── social-buttons.tsx    ✅ 社交登入按鈕 (客戶端，OAuth 需要)

app/auth/
├── login/page.tsx        ✅ 登入頁面
└── register/page.tsx     ✅ 註冊頁面

auth.config.ts            ✅ Auth.js 配置
auth.ts                   ✅ Auth.js 實例
middleware.ts             ✅ 中介軟體路由保護
```

### 需要清理的重複文件

```
❌ 需要刪除的文件：
components/auth/
├── LoginForm.tsx         ❌ 舊版本 (大寫開頭)
├── RegisterForm.tsx      ❌ 舊版本 (大寫開頭)
└── Social.tsx           ❌ 可能是舊版本

app/
└── register/page.tsx     ❌ 重複的註冊頁面 (應使用 /auth/register)

app/api/auth/
├── test-login/          ❌ 空目錄
└── dev-login/           ❌ 空目錄
```

---

## 🔄 重構前後對比

### 登入流程

#### Before (舊版)
```
1. 用戶提交表單
2. 客戶端 signIn() 調用
3. API route 設置 session cookie
4. 返回響應到客戶端
5. 客戶端手動 window.location.href 重定向
6. 頁面重新加載
7. Middleware 檢查認證
```

**問題**: 步驟 3-5 之間可能有延遲，導致 middleware 檢測不到 session

#### After (新版)
```
1. 用戶提交表單
2. Server Action 執行 (伺服器端)
3. signIn() 在伺服器端執行
4. Session cookie 立即設置
5. Auth.js 拋出 NEXT_REDIRECT
6. Next.js 處理重定向
7. Middleware 檢查認證並重定向到正確頁面
```

**優勢**: 所有操作在伺服器端完成，保證 session 正確設置

---

## 🎯 核心改進

### 1. 安全性提升
- ✅ Credentials 在伺服器端處理
- ✅ Session 在伺服器端設置和驗證
- ✅ 減少客戶端暴露的認證邏輯

### 2. 可靠性提升
- ✅ 消除 session cookie 競態條件
- ✅ Auth.js 自動處理重定向
- ✅ Middleware 與 Auth.js 完美協同

### 3. 代碼簡化
- ✅ 移除手動重定向邏輯
- ✅ 減少客戶端狀態管理
- ✅ 統一的錯誤處理

### 4. 符合標準
- ✅ 遵循 Auth.js V5 官方推薦
- ✅ 遵循 Next.js 15 App Router 模式
- ✅ 使用 React 19 Server Actions 和 Hooks (useActionState)

---

## 📚 相關文檔

- [Auth.js V5 最佳實踐](/document/AUTH_V5_BEST_PRACTICES.md)
- [Auth.js 官方文檔](https://authjs.dev)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## 🧹 建議的清理步驟

### 1. 刪除重複組件
```bash
# 刪除舊版本組件
rm components/auth/LoginForm.tsx
rm components/auth/RegisterForm.tsx

# 檢查並刪除其他可能的重複文件
rm components/auth/Social.tsx  # 如果已被 social-buttons.tsx 取代
```

### 2. 刪除重複路由
```bash
# 刪除重複的註冊頁面
rm -rf app/register/

# 刪除空的測試目錄
rm -rf app/api/auth/test-login/
rm -rf app/api/auth/dev-login/
```

### 3. 更新路由配置
確保 `routes.ts` 中只使用 `/auth/login` 和 `/auth/register`

---

## ✅ 測試清單

- [ ] 登入功能 (`/auth/login`)
  - [ ] 成功登入並重定向到 dashboard (admin)
  - [ ] 成功登入並重定向到 profile (一般用戶)
  - [ ] 錯誤處理（無效憑證）
  
- [ ] 登出功能
  - [ ] 成功登出並重定向到首頁
  - [ ] Session 正確清除
  
- [ ] 社交登入
  - [ ] Google OAuth 流程
  - [ ] GitHub OAuth 流程
  - [ ] CallbackUrl 正確處理
  
- [ ] 註冊功能 (`/auth/register`)
  - [ ] 成功註冊
  - [ ] 驗證郵件發送
  - [ ] 錯誤處理（重複 email）
  
- [ ] Middleware
  - [ ] 已認證用戶訪問 `/auth/login` 自動重定向
  - [ ] 未認證用戶訪問受保護路由重定向到登入頁
  - [ ] Admin 用戶權限檢查

---

## 🎓 重要概念總結

### 何時使用 Server Actions？
- ✅ Credentials 認證 (email/password)
- ✅ 登出
- ✅ 註冊
- ✅ 密碼重置
- ✅ 任何需要伺服器端驗證的操作

### 何時使用客戶端 signIn/signOut？
- ✅ OAuth 提供商 (Google, GitHub, etc.)
- ✅ 需要瀏覽器重定向的流程
- ❌ 不要用於 credentials 認證

### 為什麼這樣更好？
1. **安全性**: 敏感操作在伺服器端處理
2. **可靠性**: 消除競態條件
3. **簡潔性**: 減少客戶端邏輯
4. **標準性**: 符合 Auth.js V5 和 Next.js 15 最佳實踐

---

## 📖 參考資源

- [Auth.js V5 Custom Sign-in Page](https://authjs.dev/guides/pages/signin)
- [Auth.js V5 Protecting Resources](https://authjs.dev/getting-started/session-management/protecting)
- [Next.js 15 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React 19 useTransition](https://react.dev/reference/react/useTransition)

---

**重構完成日期**: 2025-10-04
**Auth.js 版本**: 5.0.0-beta.29
**Next.js 版本**: 15.5.4
**React 版本**: 19.0.0

---

## 🔄 React 19 更新 (2025-10-04)

### API 變更
- `useFormState` 已重命名為 `useActionState`
  - **舊**: `import { useFormState } from "react-dom"`
  - **新**: `import { useActionState } from "react"`
  - API 保持不變，僅更改命名和導入位置

### 更新的檔案
- ✅ `components/auth/login-form.tsx` - 已更新至 `useActionState`
