# Auth.js V5 Best Practices - 登入實現比較

## 📚 官方文檔參考

- [Auth.js V5 Custom Sign-in Page](https://authjs.dev/guides/pages/signin)
- [Protecting Resources with Middleware](https://authjs.dev/getting-started/session-management/protecting)
- [Credentials Provider](https://authjs.dev/getting-started/providers/credentials)

## 🔄 兩種登入實現方式比較

### 方法一：Client-Side signIn() (當前實現)

**檔案**: `components/auth/login-form.tsx`

```tsx
// ❌ Not recommended by Auth.js V5
const response = await signIn("credentials", {
  email,
  password,
  redirect: false,
});

// Manual redirect handling
if (typeof window !== "undefined") {
  window.location.href = nextUrl;
}
```

**缺點**:
- ❌ 需要手動處理重定向
- ❌ 可能有 session cookie 競態條件
- ❌ 客戶端暴露更多認證邏輯
- ❌ 需要額外的延遲來確保 session 設置
- ❌ 不符合 Auth.js V5 推薦模式

### 方法二：Server Actions (推薦)

**檔案**: 
- `actions/auth/login.ts` (Server Action)
- `components/auth/login-form-v5.tsx` (表單組件)

```tsx
// ✅ Auth.js V5 recommended approach
export async function loginAction(formData: FormData) {
  await signIn("credentials", {
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    redirectTo: DEFAULT_LOGIN_REDIRECT,
  });
}
```

**優點**:
- ✅ **自動重定向**: Auth.js 自動處理重定向
- ✅ **更好的安全性**: Server-side 驗證，credentials 不暴露於客戶端
- ✅ **無競態條件**: Session cookie 在伺服器端正確設置
- ✅ **符合官方推薦**: 遵循 Auth.js V5 和 Next.js 15 patterns
- ✅ **與 Middleware 完美配合**: 重定向邏輯由 middleware 統一處理

## 🎯 工作流程對比

### 客戶端 signIn() 流程
```
1. User submits form
2. Client-side signIn() called
3. API route sets session cookie
4. Response returns to client
5. Client manually redirects with window.location
6. Page reloads
7. Middleware checks authentication
8. Final redirect (if needed)
```
**問題**: 步驟 3-5 之間可能有延遲，導致步驟 7 檢測不到 session

### Server Actions 流程
```
1. User submits form
2. Server Action called (server-side)
3. signIn() executes server-side
4. Session cookie set immediately
5. Auth.js throws NEXT_REDIRECT
6. Next.js handles redirect
7. Middleware checks authentication
8. Final redirect to correct page
```
**優勢**: 所有操作在伺服器端完成，session 保證設置完成才重定向

## 🔧 Middleware 配置

你的 middleware 已經正確配置：

```typescript
// middleware.ts
export default auth(async (req) => {
  // If authenticated user accesses auth pages, redirect them
  if (req.auth && isAuthPage) {
    const target = userHasAdminPrivileges 
      ? ADMIN_LOGIN_REDIRECT 
      : DEFAULT_LOGIN_REDIRECT;
    return NextResponse.redirect(new URL(target, req.url));
  }
  // ... other logic
});
```

**與 Server Actions 的配合**:
1. Server Action 執行 `signIn()` 並設置 session
2. Auth.js 重定向到 `redirectTo` 或 `callbackUrl`
3. Middleware 檢測到已認證用戶
4. 如果是 auth 頁面，middleware 自動重定向到適當的頁面

## ✅ 已完成的修改

### 已直接更新現有文件

`components/auth/login-form.tsx` **已經改為使用 Auth.js V5 Server Actions 方式**：

**主要變更**：
1. ❌ 移除客戶端 `signIn()` from `next-auth/react`
2. ✅ 改用 `loginWithRedirectAction` Server Action
3. ✅ 使用 `useActionState` (React 19) 和 `useFormStatus` hooks
4. ✅ 自動處理重定向，無需手動 `window.location`
5. ✅ 保持相同的 UI 和使用者體驗

**React 19 更新**：
- `useFormState` 已重命名為 `useActionState`
- 從 `react-dom` 移至 `react` package
- API 保持不變，僅命名更新

**無需任何額外修改** - 現有的登入頁面將自動使用新的實現方式！

### 測試登入流程

1. 訪問 `/auth/login`
2. 輸入 `admin@example.com` / `Admin@123`
3. 提交表單
4. **預期結果**: 自動跳轉到 `/dashboard` (admin 用戶)

### 驗證 Middleware 運作

登入後訪問 `/auth/login`，應該自動重定向：
- Admin 用戶 → `/dashboard`
- 一般用戶 → `/profile`

## 🐛 常見問題解決

### Q: 為什麼之前的方式會停留在登入頁面？

**A**: 因為使用 `router.push()` 進行客戶端導航，不會觸發完整的頁面重載，middleware 可能沒有正確檢測到新的 session。

### Q: Server Actions 方式如何解決這個問題？

**A**: Server Actions 在伺服器端設置 session 並重定向，確保 middleware 在下一個請求時能正確檢測到已認證狀態。

### Q: 需要改動 auth.config.ts 嗎？

**A**: 不需要。你的 `auth.config.ts` 配置已經正確，支援兩種方式。

### Q: 社交登入 (Google/GitHub) 如何處理？

**A**: 社交登入已經使用 Auth.js 內建的重定向機制，不需要修改。

## 🎓 關鍵學習點

1. **Auth.js V5 推薦使用 Server Actions** 而非客戶端 `signIn()`
2. **讓 Auth.js 處理重定向** 而非手動使用 `router.push()` 或 `window.location`
3. **Middleware 應該處理路由保護** 和最終的重定向邏輯
4. **避免在客戶端手動管理 session** 和重定向狀態

## 📖 延伸閱讀

- [Auth.js V5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## ✅ 完成狀態

**已完成**: `login-form.tsx` 已經使用 Auth.js V5 推薦的 Server Actions 模式。

已實現的優勢：
- ✅ 解決登入後停留在登入頁面的問題
- ✅ 符合官方最佳實踐
- ✅ 提升安全性和可靠性
- ✅ 簡化代碼邏輯
- ✅ 無需手動處理重定向
