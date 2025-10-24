# 🔬 登入問題真實分析

## 📊 Vercel 日誌再分析

```
✅ JWT Token 創建成功
[JWT Callback] Token created: { roleNames: ['admin'], ... }

✅ Session 更新成功  
[Session Callback] Session updated: { email: 'admin@example.com', ... }

✅ POST 請求成功
POST /auth/login → 200 OK

❌ Middleware 讀不到 token
[Middleware] Request: { 
  pathname: '/dashboard', 
  hasToken: false,          // ← 問題
  isAuthenticated: false 
}

❌ 重定向回登入
GET /dashboard → 307 → /auth/login
```

## 🤔 重新思考：Auth.js 真的設置了 cookie 嗎？

### Context7 查詢結果

我查詢了 Auth.js 官方文檔，發現：

1. **沒有找到 `redirect: false` 不設置 cookie 的明確說明**
2. **所有範例都使用默認的重定向行為**
3. **Server Action 的 `signIn()` 預期會拋出 NEXT_REDIRECT**

### 可能的真實原因

#### 原因 1: Cookie 設置但 Middleware 讀不到

**可能問題**：
- Cookie `domain` 設置錯誤
- Cookie `path` 不匹配
- Cookie `sameSite` 限制
- Edge Runtime 的 cookie 讀取時序

**驗證方法**：
```typescript
// 在 middleware.ts 中添加
const cookies = request.cookies.getAll()
console.log('[Middleware] All cookies:', cookies)

// 查看是否有 __Secure-authjs.session-token
```

#### 原因 2: Auth.js Server Action 的特殊行為

從您的日誌看：
```
POST /auth/login → 200 OK  (不是 303!)
```

**問題**：Auth.js Server Action 應該返回 303 重定向，但返回了 200！

**這意味著**：
- `loginWithRedirectAction` 可能沒有正確調用 `signIn()`
- 或者 `signIn()` 沒有拋出 NEXT_REDIRECT

#### 原因 3: useActionState 吞掉了重定向

**問題流程**：
```
1. Form submit → loginWithRedirectAction
2. signIn() 拋出 NEXT_REDIRECT (303)
3. useActionState 捕獲錯誤 ← 問題！
4. 返回 200 OK 而非 303
5. Cookie 可能設置了，但沒有重定向
```

## 🔧 正確的修復方案

### 方案 A: 不使用 useActionState（推薦）

```tsx
// LoginForm.tsx
"use client"

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  
  // 直接使用 formData，不用 useActionState
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      // Server Action 會拋出 NEXT_REDIRECT，讓它自然發生
      await loginWithRedirectAction(formData, callbackUrl)
    } catch (error) {
      // NEXT_REDIRECT 會被拋出，這是正常的
      // 只捕獲真正的錯誤
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        toast.error(error.message)
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input name="email" type="email" required />
      <Input name="password" type="password" required />
      <Button type="submit">Login</Button>
    </form>
  )
}
```

### 方案 B: 使用 Next.js 15 的 useFormState

```tsx
// actions/auth/login.ts
export async function loginAction(
  prevState: any,
  formData: FormData
): Promise<{ error?: string } | never> {
  const email = formData.get("email")
  const password = formData.get("password")
  
  const validated = LoginSchema.safeParse({ email, password })
  if (!validated.success) {
    return { error: "Invalid credentials" }
  }
  
  // 這會拋出 NEXT_REDIRECT，不要 try-catch
  await signIn("credentials", {
    email: validated.data.email,
    password: validated.data.password,
    redirectTo: "/dashboard",
  })
  
  // 這行永遠不會執行，因為上面會拋出
}
```

```tsx
// LoginForm.tsx
import { useFormState } from "react-dom"
import { loginAction } from "@/actions/auth"

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null)
  
  return (
    <form action={formAction}>
      {state?.error && <FormError message={state.error} />}
      <Input name="email" type="email" required />
      <Input name="password" type="password" required />
      <Button type="submit">Login</Button>
    </form>
  )
}
```

### 方案 C: 檢查 Cookie 設置

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 調試：列出所有 cookies
  const allCookies = request.cookies.getAll()
  console.log('[Middleware] Cookies:', allCookies.map(c => c.name))
  
  // 特別檢查 Auth.js cookie
  const authCookie = request.cookies.get('__Secure-authjs.session-token')
  console.log('[Middleware] Auth cookie:', authCookie ? 'exists' : 'missing')
  
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET,
  })
  
  console.log('[Middleware] Token:', token ? 'parsed' : 'null')
  
  // ... rest of middleware
}
```

## 🧪 診斷步驟

### Step 1: 確認 Cookie 是否設置

在 Chrome DevTools：
1. Network → POST `/auth/login`
2. Response Headers → 查找 `Set-Cookie`
3. 應該看到 `__Secure-authjs.session-token=...`

### Step 2: 確認 Middleware 能否讀取

查看 Vercel 日誌：
```
[Middleware] Cookies: ['__Secure-authjs.session-token', ...]
[Middleware] Auth cookie: exists
[Middleware] Token: parsed  // ← 如果是 'null'，問題在這裡
```

### Step 3: 確認 POST 響應碼

**正確**：`POST /auth/login → 303 See Other`  
**錯誤**：`POST /auth/login → 200 OK` ← 您當前的狀況

## 🎯 結論

根據您的日誌 `POST /auth/login → 200 OK`，問題不是 `redirect: false`，而是：

**useActionState 阻止了 Next.js 的自然重定向流**

Auth.js 的 `signIn()` 會拋出 `NEXT_REDIRECT` 錯誤來觸發重定向，但 `useActionState` 捕獲了這個"錯誤"並返回 200 OK。

**修復方向**：
1. ✅ 不使用 useActionState
2. ✅ 使用原生 `<form action={serverAction}>`
3. ✅ 讓 NEXT_REDIRECT 自然發生

---

**創建時間**: 2025-10-24 23:58 UTC+8  
**狀態**: 需要測試方案 A 或 B
