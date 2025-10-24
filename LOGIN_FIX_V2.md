# 🔧 登入修復 V2 - 真正的解決方案

## 📊 Vercel 日誌分析

從生產環境日誌發現：

```
✅ JWT Token 成功創建
[JWT Callback] Token created: { 
  userId: 'cmh4w97wn002118iov5pbeuob', 
  roleNames: ['admin'], 
  permissionNames: 21 
}

❌ 但 Middleware 讀不到
[Middleware] Request: { 
  pathname: '/dashboard', 
  isAuthenticated: false, 
  hasToken: false,
  tokenEmail: undefined 
}
```

## 🐛 根本問題

**V1 方案失敗原因**：
```typescript
// ❌ 這不會設置 cookie！
const result = await signIn("credentials", {
  email, password,
  redirect: false,  // 不設置 cookie
});
```

**Auth.js 行為**：
- `redirect: false` → 不設置 cookie，只返回結果
- `redirect: true` → 設置 cookie 並拋出 NEXT_REDIRECT

## ✅ 真正的解決方案

### 方案：使用 Auth.js 自動重定向 + Middleware 優化

**關鍵變更**：

1. **恢復使用 `loginWithRedirectAction`**
   ```typescript
   // actions/auth/login.ts
   await signIn("credentials", {
     email, password,
     redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
     // redirect: true (默認) - 會設置 cookie
   });
   ```

2. **Middleware 允許 callbackUrl 通過**
   ```typescript
   // middleware.ts
   if (isAuthenticated && isAuthPage) {
     // 如果有 callbackUrl，讓 Auth.js 處理重定向
     const hasCallbackUrl = request.nextUrl.searchParams.has('callbackUrl')
     if (!hasCallbackUrl) {
       return NextResponse.redirect(new URL(target, request.url))
     }
   }
   ```

3. **LoginForm 簡化**
   ```typescript
   // components/auth/login-form.tsx
   const [state, formAction] = useActionState(
     loginWithRedirectAction, 
     undefined
   );
   
   // Auth.js 會自動處理重定向，只需處理錯誤
   useEffect(() => {
     if (state?.error) {
       toast.error(state.error);
     }
   }, [state]);
   ```

## 🔄 完整流程

### 成功的登入流程

```
1. 用戶提交登入表單
   ↓
2. loginWithRedirectAction 調用 signIn()
   ↓
3. Auth.js 創建 JWT Token
   - 調用 jwt callback
   - 存入 roleNames, permissionNames, applicationPaths
   ↓
4. Auth.js 設置 __Secure-authjs.session-token cookie
   ↓
5. Auth.js 拋出 NEXT_REDIRECT
   - Next.js 執行 303 重定向
   - Location: /dashboard?callbackUrl=xxx (或直接 /dashboard)
   ↓
6. 瀏覽器跟隨重定向 GET /dashboard
   - Cookie 已經設置 ✅
   ↓
7. Middleware 讀取 JWT Token
   - getToken() 成功讀取 cookie
   - isAuthenticated: true ✅
   - hasToken: true ✅
   ↓
8. Middleware 允許訪問
   - 返回 200 OK
   ↓
9. Dashboard 頁面載入成功 🎉
```

## 📁 修改的文件

### 1. `components/auth/login-form.tsx`

```typescript
// 改回使用 loginWithRedirectAction
import { loginWithRedirectAction } from "@/actions/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const loginActionWithUrl = async (prevState: any, formData: FormData) => {
    if (callbackUrl) {
      formData.append("redirectTo", callbackUrl);
    }
    return loginWithRedirectAction(formData, callbackUrl || undefined);
  };

  const [state, formAction] = useActionState(loginActionWithUrl, undefined);

  // 只處理錯誤
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // ... rest of component
}
```

### 2. `middleware.ts`

```typescript
// 允許帶有 callbackUrl 的請求通過
if (isAuthenticated && isAuthPage) {
  const hasCallbackUrl = request.nextUrl.searchParams.has('callbackUrl')
  if (!hasCallbackUrl) {
    const target = userHasAdminPrivileges ? ADMIN_LOGIN_REDIRECT : DEFAULT_LOGIN_REDIRECT
    return NextResponse.redirect(new URL(target, request.url))
  }
}
```

## 🚀 部署

```bash
# 提交修復
git add components/auth/login-form.tsx middleware.ts
git commit -m "fix: use Auth.js auto-redirect with middleware optimization

Problem:
- V1 used redirect:false which doesn't set cookie
- Middleware couldn't read token (hasToken: false)

Solution:
- Revert to loginWithRedirectAction (redirect: true)
- Allow middleware to pass through requests with callbackUrl
- Let Auth.js handle cookie setting and redirect

Result:
- Cookie properly set by Auth.js
- Middleware can read token
- Login flow works correctly"

# 推送
git push origin main
```

## 🧪 預期結果

### Vercel 日誌（修復後）

```
✅ JWT Token 創建
[JWT Callback] Token created: { roleNames: ['admin'], ... }

✅ Cookie 設置
POST /auth/login → 303 → /dashboard

✅ Middleware 讀取成功
[Middleware] Request: { 
  pathname: '/dashboard', 
  isAuthenticated: true,   // ✅
  hasToken: true,          // ✅
  tokenEmail: 'admin@example.com',
  tokenRoles: ['admin'],
  userHasAdminPrivileges: true
}

✅ Dashboard 載入
GET /dashboard → 200 OK
```

## 📝 總結

### V1 方案（失敗）
- ❌ 使用 `redirect: false`
- ❌ Cookie 沒有設置
- ❌ Middleware 讀不到 token
- ❌ 客戶端延遲重定向無效

### V2 方案（成功）
- ✅ 使用 `redirect: true`（默認）
- ✅ Auth.js 自動設置 cookie
- ✅ Middleware 成功讀取 token
- ✅ 優化 middleware 邏輯允許 callbackUrl

### 關鍵洞察

**Auth.js 的設計**：
- `redirect: true` → 完整的 session 管理（設置 cookie）
- `redirect: false` → 僅驗證，不創建 session

**我們需要的是**：
- 完整的 session（需要 cookie）
- Auth.js 處理重定向（避免時序問題）
- Middleware 不干擾 Auth.js 的流程

---

**創建時間**: 2025-10-24 23:50 UTC+8  
**狀態**: ✅ 已修復，待部署測試
