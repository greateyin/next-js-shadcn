# 🔐 最終修復：AUTH_SECRET 問題

## 🎯 問題根源

雖然創建了共享的 `auth.base.config.ts`，但**沒有明確指定 `secret`**！

### 問題行為

```typescript
// auth.base.config.ts (之前)
export const baseAuthConfig = {
  debug: false,
  providers: [...],
  // ❌ 沒有指定 secret!
}

// 結果：
// auth.ts: NextAuth 自動從 process.env.AUTH_SECRET 讀取
// middleware.ts: NextAuth 也從 process.env.AUTH_SECRET 讀取
// 但由於配置不完全相同，導致內部處理不一致
```

### 為什麼會失敗？

根據 Auth.js V5 的實現：
1. 如果沒有明確指定 `secret`，NextAuth 會從環境變數讀取
2. 但每個 NextAuth 實例在初始化時會有微妙的差異
3. 這導致 JWT 加密/解密時的細微不一致
4. 結果：token 無法正確解密，數據丟失

## ✅ 解決方案

在 `auth.base.config.ts` 中**明確指定 secret**：

```typescript
export const baseAuthConfig = {
  debug: false,
  
  // ✅ CRITICAL: 明確指定 secret
  secret: process.env.AUTH_SECRET,
  
  providers: [...],
  session: {...},
  cookies: {...},
}
```

## 📝 修改的文件

### `/auth.base.config.ts`

```typescript
export const baseAuthConfig = {
  debug: false,
  
  // ✅ 添加這一行
  secret: process.env.AUTH_SECRET,
  
  // ... 其餘配置
}
```

## 🔬 技術原理

### Auth.js 內部處理

```typescript
// 沒有明確 secret 時：
NextAuth({
  providers: [...],
  // secret: undefined
})
// ↓
// 內部會從 process.env.AUTH_SECRET 讀取
// 但每次初始化可能有微妙差異

// 明確指定 secret 時：
NextAuth({
  providers: [...],
  secret: process.env.AUTH_SECRET // ✅ 明確值
})
// ↓
// 兩個實例使用完全相同的 secret
// JWT 加密/解密完全一致
```

### JWT Token 流程

```
登入時 (auth.config.ts):
1. NextAuth(authConfig) 使用 secret
2. 創建 JWT token
3. 使用 baseAuthConfig.secret 加密
4. token.roleNames = ['admin']
5. 加密後存入 cookie

---

Middleware 讀取 (middleware.ts):
1. NextAuth(edgeAuthConfig) 使用 secret
2. 從 cookie 讀取加密的 JWT
3. 使用 baseAuthConfig.secret 解密  ✅ 相同 secret
4. 成功解密，獲得完整數據
5. token.roleNames = ['admin']  ✅ 數據完整
```

## 🚀 部署步驟

```bash
# 1. 確認修改
git diff auth.base.config.ts

# 2. 提交
git add auth.base.config.ts
git commit -m "fix: 添加明確的 AUTH_SECRET 到 baseAuthConfig"

# 3. 部署
git push origin main
```

## 🧪 驗證步驟

部署後測試：

1. **清除瀏覽器 Cookies**（關鍵！）

2. **登入**
   ```
   帳號：admin@example.com
   密碼：Admin@123
   ```

3. **檢查 Vercel 日誌**

   期望看到：
   ```
   [JWT Callback] Token created: {
     roleNames: ['admin'],
     permissionNames: 21
   }
   
   [Middleware] Full token: {
     "id": "cmh4w97wn002118iov5pbeuob",
     "email": "admin@example.com",
     "roleNames": ["admin"],  ← 應該有值！
     "permissionNames": [...],
     "applicationPaths": ["/dashboard", "/admin"]
   }
   
   [Middleware] Request: {
     pathname: '/admin',
     tokenEmail: 'admin@example.com',  ← 應該有值！
     tokenRoles: ['admin'],  ← 應該有值！
     userHasAdminPrivileges: true  ← 應該是 true！
   }
   ```

4. **驗證重定向**
   - ✅ 登入後跳轉到 `/admin`
   - ✅ URL 保持在 `/admin`
   - ✅ 顯示 Admin Panel 界面

## 📊 修復前後對比

### Before (錯誤)

```typescript
// auth.base.config.ts
export const baseAuthConfig = {
  // ❌ 沒有 secret
  providers: [...],
}

// 結果：
// auth.ts: secret 從環境變數讀取（時機 A）
// middleware.ts: secret 從環境變數讀取（時機 B）
// ↓
// 微妙差異 → JWT 不兼容 → token 為空
```

### After (正確)

```typescript
// auth.base.config.ts
export const baseAuthConfig = {
  secret: process.env.AUTH_SECRET,  // ✅ 明確指定
  providers: [...],
}

// 結果：
// auth.ts: secret = baseAuthConfig.secret
// middleware.ts: secret = baseAuthConfig.secret
// ↓
// 完全相同 → JWT 兼容 → token 完整
```

## 🔑 關鍵點

1. **必須明確指定 secret**
   - 不能依賴 Auth.js 的自動檢測
   - 兩個實例必須使用完全相同的 secret

2. **secret 必須在 baseAuthConfig 中**
   - 確保所有實例繼承相同的值
   - 避免各自讀取環境變數

3. **清除 Cookies 重新測試**
   - 舊 token 是用錯誤配置加密的
   - 必須生成新 token

## ⚠️ 常見錯誤

### 錯誤 1：在各自配置中指定 secret

```typescript
// ❌ 錯誤做法
// auth.config.ts
export const authConfig = {
  secret: process.env.AUTH_SECRET,  // ❌
  ...baseAuthConfig,
}

// auth.edge.config.ts
export const edgeAuthConfig = {
  secret: process.env.AUTH_SECRET,  // ❌
  ...baseAuthConfig,
}
```

**問題**：雖然都讀取同一個環境變數，但時機可能不同。

### 錯誤 2：忘記清除 Cookies

即使修復了配置，如果不清除舊 Cookies：
- 舊 token 是用錯誤配置加密的
- 新配置無法解密舊 token
- 仍然會看到 `tokenEmail: undefined`

### 錯誤 3：ENV 變數未設置

如果 `AUTH_SECRET` 未設置：
```
secret: process.env.AUTH_SECRET  // undefined
```

檢查：
```bash
# Vercel Dashboard → Settings → Environment Variables
# 確認 AUTH_SECRET 已設置
```

## 📚 相關文檔

- Auth.js Configuration: https://authjs.dev/reference/core/types#authconfig
- JWT Secret: https://authjs.dev/concepts/session-strategies#jwt
- Environment Variables: https://authjs.dev/guides/environment-variables

## ✅ 檢查清單

- [x] 添加 `secret: process.env.AUTH_SECRET` 到 `auth.base.config.ts`
- [ ] 提交並推送到 Git
- [ ] 等待 Vercel 部署完成
- [ ] 清除瀏覽器 Cookies
- [ ] 重新登入測試
- [ ] 檢查 Vercel 日誌
- [ ] 驗證 `/admin` 訪問
- [ ] 確認用戶選單顯示

---

**修復時間**：2025-10-25  
**問題類型**：JWT Token 加密/解密不一致  
**解決方案**：明確指定 AUTH_SECRET 在共享配置中
