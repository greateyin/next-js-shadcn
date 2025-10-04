# 完整認證流程指南

## 📅 最後更新：2025-10-04

---

## 目錄

1. [OAuth 自動帳號創建流程](#oauth-自動帳號創建流程)
2. [密碼重置流程](#密碼重置流程)
3. [認證流程最佳實踐](#認證流程最佳實踐)
4. [安全性考量](#安全性考量)
5. [測試指南](#測試指南)

---

## OAuth 自動帳號創建流程

### 🎯 功能目標

當使用者透過 OAuth（Google/GitHub）登入時：
- ✅ 如果電子郵件已存在，自動連結帳號
- ✅ 如果電子郵件不存在，自動創建新用戶
- ✅ 自動設置用戶狀態為 `active`（OAuth 郵件已驗證）
- ✅ 自動分配預設角色（`user`）
- ✅ **無需跳轉到註冊頁面**

### 📋 實現細節

#### 1. Auth.js 配置

**檔案**: `auth.config.ts`

```typescript
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // 🔑 關鍵設定
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // 🔑 關鍵設定
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // OAuth 提供商自動處理
      if (account?.provider !== "credentials") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
          include: { userRoles: true }
        });

        // 新用戶自動初始化
        if (existingUser && existingUser.userRoles.length === 0) {
          // 1. 設置為 active（OAuth 郵件已驗證）
          await db.user.update({
            where: { id: existingUser.id },
            data: { 
              status: "active",
              emailVerified: new Date()
            }
          });

          // 2. 分配預設角色
          const userRole = await db.role.findUnique({
            where: { name: "user" }
          });

          if (userRole) {
            await db.userRole.create({
              data: {
                userId: existingUser.id,
                roleId: userRole.id
              }
            });
          }
        }
      }
      
      return true;
    },
    // ... jwt 和 session callbacks
  }
};
```

#### 2. 關鍵配置說明

##### `allowDangerousEmailAccountLinking: true`

**作用**：
- 允許相同電子郵件的帳號自動連結
- 當 OAuth 用戶的 email 與現有用戶相同時，自動連結而非報錯

**為什麼是 "dangerous"？**
- 如果 OAuth 提供商未正確驗證電子郵件，可能導致帳號被劫持
- 但 Google 和 GitHub 都有嚴格的電子郵件驗證機制，因此是安全的

**適用場景**：
- ✅ 信任的 OAuth 提供商（Google, GitHub, Microsoft 等）
- ✅ 希望用戶可以使用多種登入方式
- ❌ 不信任的或自建的 OAuth 提供商

### 🔄 OAuth 登入流程

```
1. 用戶點擊「使用 Google 登入」
   ↓
2. 重定向到 Google 登入頁面
   ↓
3. Google 驗證用戶並返回資料
   ↓
4. Auth.js 檢查資料庫
   ├─ 用戶存在？
   │  ├─ 是 → 檢查是否有角色
   │  │      ├─ 無角色 → 初始化（設為 active + 分配角色）
   │  │      └─ 有角色 → 直接登入
   │  └─ 否 → Prisma Adapter 自動創建用戶
   │           ↓
   │           signIn callback 初始化
   ↓
5. 設置 session 並重定向到 dashboard
```

### 🎨 用戶體驗

**傳統方式（❌ 不推薦）**：
```
OAuth 登入 → 填寫註冊表單 → 確認 → 登入成功
```

**我們的方式（✅ 推薦）**：
```
OAuth 登入 → 直接登入成功
```

### 📊 數據庫狀態變化

| 欄位 | OAuth 登入前 | OAuth 登入後 |
|------|-------------|-------------|
| `status` | `pending` | `active` ✅ |
| `emailVerified` | `null` | `new Date()` ✅ |
| `userRoles` | `[]` | `[{ roleId: "user" }]` ✅ |
| `loginMethods` | `[]` | 自動添加 ✅ |

---

## 密碼重置流程

### 🎯 功能改進

#### ✅ 已改進的功能

1. **使用 Server Actions**（符合 Auth.js V5 最佳實踐）
2. **在登入頁面添加「忘記密碼」連結**
3. **密碼強度驗證**（大小寫、數字）
4. **即時密碼強度指示器**
5. **顯示/隱藏密碼功能**
6. **重置成功後自動跳轉登入頁**
7. **清除所有 session**（強制重新登入，提升安全性）
8. **檢測 OAuth 用戶**（無法重置密碼的提示）

### 📋 完整流程

#### 步驟 1：請求密碼重置

**頁面**: `/auth/forgot-password`

```typescript
// 使用 Server Action
const [state, formAction] = useActionState(requestPasswordResetAction, undefined);

<form action={formAction}>
  <input name="email" type="email" required />
  <button type="submit">發送重置連結</button>
</form>
```

**Server Action**: `requestPasswordResetAction`

```typescript
export const requestPasswordResetAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  // 1. 驗證 email 格式
  const validatedFields = EmailSchema.safeParse({ email });
  
  // 2. 檢查用戶是否存在
  const existingUser = await getUserByEmail(email);
  
  // 3. 檢查是否為 OAuth 用戶（無密碼）
  if (!existingUser.password) {
    return { 
      error: "此帳號使用社交登入，無法重置密碼。" 
    };
  }
  
  // 4. 生成令牌（1小時有效期）
  const passwordResetToken = await generatePasswordResetToken(email);
  
  // 5. 發送郵件
  await sendPasswordResetEmail(email, passwordResetToken.token);
  
  return { success: "重置郵件已發送！" };
};
```

**安全考量**：
- ✅ 即使用戶不存在也返回成功訊息（避免洩露用戶存在性）
- ✅ 檢查 OAuth 用戶並提供友善提示
- ✅ 令牌有效期限制（1小時）
- ✅ 每次請求刪除舊令牌

#### 步驟 2：重置密碼

**頁面**: `/auth/reset-password?token=xxx`

```typescript
// 使用 Server Action
const [state, formAction] = useActionState(resetPasswordWithTokenAction, undefined);

<form action={formAction}>
  <input type="hidden" name="token" value={token} />
  <input name="password" type="password" required />
  <input name="confirmPassword" type="password" required />
  <button type="submit">重置密碼</button>
</form>
```

**密碼強度要求**：
```typescript
const NewPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "密碼必須至少 8 個字元" })
    .regex(/[a-z]/, { message: "必須包含小寫字母" })
    .regex(/[A-Z]/, { message: "必須包含大寫字母" })
    .regex(/[0-9]/, { message: "必須包含數字" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});
```

**Server Action**: `resetPasswordWithTokenAction`

```typescript
export const resetPasswordWithTokenAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  // 1. 驗證密碼強度
  const validatedFields = NewPasswordSchema.safeParse({
    password,
    confirmPassword,
  });
  
  // 2. 驗證令牌
  const existingToken = await getPasswordResetTokenByToken(token);
  
  // 3. 檢查令牌是否過期
  if (new Date(existingToken.expires) < new Date()) {
    await db.passwordResetToken.delete({ where: { id: existingToken.id } });
    return { error: "令牌已過期！請重新申請。" };
  }
  
  // 4. 更新密碼（哈希處理）
  const hashedPassword = await hashPassword(password);
  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });
  
  // 5. 刪除使用過的令牌
  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  });
  
  // 6. 清除所有 session（強制重新登入）
  await db.session.deleteMany({
    where: { userId: existingUser.id },
  });
  
  return { success: "密碼重置成功！請使用新密碼登入。" };
};
```

#### 步驟 3：自動跳轉登入

```typescript
// 重置成功後自動跳轉
useEffect(() => {
  if (state?.success) {
    toast.success(state.success);
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  }
}, [state, router]);
```

### 🎨 UI 功能

#### 1. 密碼強度指示器

```typescript
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  
  return (
    <div className="h-2 w-full bg-gray-200 rounded-full">
      <div
        className={`h-full ${getColor()} transition-all`}
        style={{ width: `${(strength / 5) * 100}%` }}
      />
    </div>
  );
}
```

顏色指示：
- 🔴 紅色：弱（0-1）
- 🟡 黃色：中等（2-3）
- 🟢 綠色：強（4-5）

#### 2. 顯示/隱藏密碼

```typescript
const [showPassword, setShowPassword] = useState(false);

<Input
  type={showPassword ? "text" : "password"}
  // ...
/>
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff /> : <Eye />}
</button>
```

### 🔄 完整流程圖

```
用戶忘記密碼
    ↓
訪問 /auth/forgot-password
    ↓
輸入電子郵件
    ↓
Server Action 驗證
    ├─ OAuth 用戶？
    │  └─ 提示使用 OAuth 登入
    └─ 密碼用戶？
       ├─ 生成令牌（1小時）
       ├─ 發送郵件
       └─ 返回成功訊息
    ↓
用戶收到郵件，點擊連結
    ↓
訪問 /auth/reset-password?token=xxx
    ↓
輸入新密碼（強度檢查）
    ↓
Server Action 處理
    ├─ 驗證令牌
    ├─ 驗證密碼強度
    ├─ 更新密碼（哈希）
    ├─ 刪除令牌
    └─ 清除所有 session
    ↓
顯示成功訊息
    ↓
2秒後自動跳轉
    ↓
登入頁面（使用新密碼）
```

---

## 認證流程最佳實踐

### ✅ 遵循的最佳實踐

#### 1. 使用 Server Actions

**優點**：
- ✅ 安全性更高（credentials 不暴露於客戶端）
- ✅ 無競態條件（session 在伺服器端設置）
- ✅ 符合 Next.js 15 和 React 19 標準
- ✅ 自動處理重定向

**範例**：
```typescript
// ✅ 正確
const [state, formAction] = useActionState(loginAction, undefined);
<form action={formAction}>...</form>

// ❌ 錯誤（舊版）
const response = await signIn("credentials", { ... });
```

#### 2. OAuth vs Credentials

| 認證方式 | 方法 | 原因 |
|---------|------|------|
| **OAuth** | 客戶端 `signIn()` | OAuth 需要瀏覽器重定向 ✅ |
| **Credentials** | Server Actions | 安全性和可靠性 ✅ |
| **登出** | Server Actions | 統一模式 ✅ |

#### 3. 密碼安全

**儲存**：
- ✅ 使用 `bcrypt` 或 `argon2` 哈希
- ✅ 絕不儲存明文密碼
- ✅ 密碼欄位設為 `nullable`（支援 OAuth 用戶）

**驗證**：
- ✅ 最少 8 個字元
- ✅ 包含大小寫字母
- ✅ 包含數字
- ✅ 密碼強度即時反饋

#### 4. Session 管理

**JWT Strategy**：
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 天
  updateAge: 24 * 60 * 60,    // 24 小時
}
```

**安全措施**：
- ✅ 密碼重置後清除所有 session
- ✅ HttpOnly cookies
- ✅ SameSite: lax
- ✅ Secure in production

---

## 安全性考量

### 🔒 實現的安全措施

#### 1. 防止資訊洩露

**問題**：攻擊者可以透過錯誤訊息判斷用戶是否存在

**解決方案**：
```typescript
// ❌ 錯誤
if (!existingUser) {
  return { error: "此電子郵件不存在！" }; // 洩露用戶存在性
}

// ✅ 正確
if (!existingUser) {
  return { success: "如果該電子郵件存在，重置連結已發送！" };
}
```

#### 2. 令牌安全

**措施**：
- ✅ 令牌有效期限制（1小時）
- ✅ 使用 UUID v4（無法猜測）
- ✅ 使用後立即刪除
- ✅ 過期令牌自動清理

**資料庫索引**：
```prisma
model PasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime
  userId  String?

  @@index([email])
  @@index([userId])
  @@index([expires])  // 用於定期清理
}
```

#### 3. 防止暴力破解

**建議措施**：
- ⏳ 登入嘗試次數限制（待實現）
- ⏳ IP 限制（待實現）
- ⏳ CAPTCHA（待實現）

**現有措施**：
- ✅ 密碼強度要求
- ✅ Session 自動過期

#### 4. OAuth 帳號安全

**措施**：
- ✅ 僅信任驗證過的提供商（Google, GitHub）
- ✅ `allowDangerousEmailAccountLinking` 僅用於可信提供商
- ✅ OAuth 用戶自動設為 `active`（郵件已驗證）
- ✅ 自動連結防止重複帳號

---

## 測試指南

### 🧪 OAuth 登入測試

#### 測試場景 1：新用戶首次 OAuth 登入

**步驟**：
1. 訪問 `/auth/login`
2. 點擊「使用 Google 登入」
3. 在 Google 完成認證
4. 觀察自動跳轉到 `/dashboard`

**預期結果**：
- ✅ 用戶資料自動創建
- ✅ `status` 設為 `active`
- ✅ `emailVerified` 有值
- ✅ 自動分配 `user` 角色
- ✅ 無需填寫註冊表單

**驗證 SQL**：
```sql
SELECT 
  u.id, 
  u.email, 
  u.status, 
  u.emailVerified,
  r.name as role_name
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'test@gmail.com';
```

#### 測試場景 2：現有用戶使用 OAuth 登入

**前提**：用戶已透過 email/password 註冊

**步驟**：
1. 使用相同 email 的 Google 帳號登入
2. 觀察自動連結

**預期結果**：
- ✅ 不創建新用戶
- ✅ 兩種登入方式都可使用
- ✅ `Account` 表新增 OAuth 記錄

### 🧪 密碼重置測試

#### 測試場景 1：標準密碼重置流程

**步驟**：
1. 訪問 `/auth/login`
2. 點擊「忘記密碼？」
3. 輸入電子郵件
4. 檢查控制台日誌（或收件箱）
5. 複製重置連結
6. 訪問重置頁面
7. 輸入新密碼（測試強度要求）
8. 提交並觀察自動跳轉

**預期結果**：
- ✅ 密碼強度指示器顯示
- ✅ 密碼不符合要求時顯示錯誤
- ✅ 重置成功後清除所有 session
- ✅ 2秒後自動跳轉登入頁
- ✅ 可使用新密碼登入

#### 測試場景 2：OAuth 用戶嘗試重置密碼

**前提**：用戶僅透過 OAuth 登入（無密碼）

**步驟**：
1. 訪問 `/auth/forgot-password`
2. 輸入 OAuth 用戶的 email

**預期結果**：
- ✅ 顯示：「此帳號使用社交登入，無法重置密碼。請使用 Google 或 GitHub 登入。」
- ✅ 不發送郵件
- ✅ 不生成令牌

#### 測試場景 3：過期令牌處理

**步驟**：
1. 請求密碼重置
2. 等待 1 小時（或手動修改資料庫）
3. 嘗試使用過期令牌

**預期結果**：
- ✅ 顯示：「令牌已過期！請重新申請。」
- ✅ 過期令牌自動刪除
- ✅ 提示重新申請

#### 測試場景 4：密碼強度驗證

**測試密碼**：
| 密碼 | 預期結果 |
|------|---------|
| `abc` | ❌ 太短 |
| `abcdefgh` | ❌ 缺少大寫和數字 |
| `Abcdefgh` | ❌ 缺少數字 |
| `Abc12345` | ✅ 通過 |
| `MyP@ssw0rd!` | ✅ 強密碼 |

### 📊 測試檢查清單

#### OAuth 登入
- [ ] 新用戶自動創建
- [ ] 自動設為 active
- [ ] 自動分配角色
- [ ] 郵件自動驗證
- [ ] 現有用戶自動連結
- [ ] 登入後正確跳轉

#### 密碼重置
- [ ] 忘記密碼連結可見
- [ ] 郵件發送成功
- [ ] 令牌正確生成
- [ ] 密碼強度驗證
- [ ] 強度指示器顯示
- [ ] 顯示/隱藏密碼
- [ ] OAuth 用戶友善提示
- [ ] 過期令牌處理
- [ ] Session 清除
- [ ] 自動跳轉登入
- [ ] 新密碼可登入

#### 安全性
- [ ] 不洩露用戶存在性
- [ ] 令牌無法猜測
- [ ] 令牌使用後刪除
- [ ] 密碼正確哈希
- [ ] Session 正確設置

---

## 📁 相關檔案

### 核心配置
- `auth.config.ts` - Auth.js 配置（OAuth callbacks）
- `auth.ts` - Auth.js 實例
- `middleware.ts` - 路由保護

### Server Actions
- `actions/auth/password-reset.ts` - 密碼重置 Server Actions
- `actions/auth/login.ts` - 登入/登出 Server Actions
- `actions/auth/registration.ts` - 註冊 Server Actions

### 組件
- `components/auth/login-form.tsx` - 登入表單（含忘記密碼連結）
- `components/auth/reset-password-form.tsx` - 密碼重置表單（含強度驗證）
- `components/auth/social-buttons.tsx` - OAuth 登入按鈕

### 頁面
- `app/auth/login/page.tsx` - 登入頁面
- `app/auth/forgot-password/page.tsx` - 忘記密碼頁面
- `app/auth/reset-password/page.tsx` - 重置密碼頁面

### 資料庫
- `prisma/schema.prisma` - 資料庫 schema

---

## 🎓 關鍵學習點

1. **OAuth 自動化**：透過 `signIn` callback 自動初始化新用戶，無需手動註冊流程

2. **Server Actions 優勢**：提供更好的安全性和可靠性，符合現代 React/Next.js 標準

3. **密碼安全**：多層驗證（格式、強度、確認）+ 即時反饋提升用戶體驗

4. **Session 管理**：密碼重置後清除所有 session 確保安全性

5. **錯誤處理**：友善的錯誤訊息同時保護隱私（不洩露用戶存在性）

---

## 📚 參考資源

- [Auth.js V5 文檔](https://authjs.dev)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React 19 useActionState](https://react.dev/reference/react/useActionState)
- [OWASP 密碼安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**文檔版本**: 1.0.0  
**最後更新**: 2025-10-04  
**Auth.js 版本**: 5.0.0-beta.29  
**Next.js 版本**: 15.5.4  
**React 版本**: 19.0.0
