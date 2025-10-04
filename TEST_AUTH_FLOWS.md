# Auth 流程測試指南

## 🚀 快速測試

### 前置準備

```bash
# 1. 啟動開發伺服器
pnpm dev

# 2. 確保資料庫已遷移
pnpm prisma migrate dev

# 3. 確保有預設角色
pnpm prisma db seed
```

---

## 測試 1: OAuth 自動帳號創建

### 🎯 測試目標
驗證 OAuth 登入時自動創建並初始化用戶，無需註冊頁面。

### 📋 步驟

1. **開啟登入頁面**
   ```
   http://localhost:3000/auth/login
   ```

2. **點擊「Google」或「GitHub」按鈕**
   - 如果是開發環境，需要配置 OAuth credentials
   - 查看 `.env.example` 了解需要的環境變數

3. **完成 OAuth 認證**
   - 在 Google/GitHub 頁面登入
   - 授權應用程式

4. **觀察結果**
   - ✅ 應該直接跳轉到 `/dashboard`
   - ✅ 不應該停留在登入頁或註冊頁
   - ✅ 不應該要求填寫額外資訊

### ✅ 驗證

**檢查資料庫**：
```sql
-- 查看新用戶資料
SELECT 
  u.id,
  u.email,
  u.name,
  u.status,
  u.emailVerified,
  r.name as role_name
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = '你的OAuth郵件@gmail.com'
ORDER BY u.createdAt DESC
LIMIT 1;
```

**預期結果**：
```
email: your_email@gmail.com
status: active                 ✅
emailVerified: 2025-10-04...   ✅
role_name: user                ✅
```

**檢查 Account 表**：
```sql
SELECT 
  provider,
  type,
  "userId"
FROM "Account"
WHERE "userId" = '剛才查到的user_id';
```

**預期結果**：
```
provider: google (或 github)
type: oauth
userId: [有值]
```

### 🔄 重複測試（帳號連結）

1. **使用 email/password 註冊一個帳號**
   - Email: test@example.com

2. **使用相同 email 的 Google 帳號登入**

3. **預期結果**：
   - ✅ 不創建新用戶
   - ✅ 自動連結到現有帳號
   - ✅ 兩種登入方式都可用

---

## 測試 2: 密碼重置流程

### 🎯 測試目標
驗證密碼重置的完整流程，包括密碼強度驗證和自動跳轉。

### 📋 步驟

#### 2.1 請求密碼重置

1. **訪問登入頁面**
   ```
   http://localhost:3000/auth/login
   ```

2. **點擊「忘記密碼？」連結**
   - 應該在密碼欄位下方

3. **輸入已註冊的 email**
   ```
   test@example.com
   ```

4. **點擊「發送重置連結」**

5. **觀察結果**：
   - ✅ 顯示成功訊息
   - ✅ Toast 通知顯示
   - ✅ 表單不應重置（可以看到輸入的 email）

6. **檢查控制台日誌**（開發模式）：
   ```
   📧 Password Reset Email
   To: test@example.com
   Reset Link: http://localhost:3000/auth/reset-password?token=...
   Token: [UUID]
   ```

7. **複製重置連結**

#### 2.2 重置密碼

1. **訪問重置連結**
   ```
   http://localhost:3000/auth/reset-password?token=xxx
   ```

2. **測試密碼強度驗證**：

   | 密碼 | 預期結果 |
   |------|----------|
   | `abc` | ❌ 錯誤：太短 |
   | `abcdefgh` | ❌ 錯誤：缺少大寫和數字 |
   | `Abcdefgh` | ❌ 錯誤：缺少數字 |
   | `abcd1234` | ❌ 錯誤：缺少大寫 |
   | `ABCD1234` | ❌ 錯誤：缺少小寫 |
   | `Abc12345` | ✅ 通過 |

3. **觀察密碼強度指示器**：
   - 輸入弱密碼 → 紅色
   - 輸入中等密碼 → 黃色
   - 輸入強密碼 → 綠色

4. **測試顯示/隱藏密碼**：
   - 點擊眼睛圖標
   - 密碼應該在明文/隱藏之間切換

5. **輸入有效密碼**：
   ```
   新密碼: MyNewP@ssw0rd
   確認密碼: MyNewP@ssw0rd
   ```

6. **提交表單**

7. **觀察結果**：
   - ✅ 顯示成功訊息
   - ✅ Toast 通知
   - ✅ 2秒後自動跳轉到 `/auth/login`

8. **使用新密碼登入**：
   ```
   Email: test@example.com
   Password: MyNewP@ssw0rd
   ```
   - ✅ 應該成功登入

### ✅ 驗證

**檢查令牌是否刪除**：
```sql
SELECT * FROM "PasswordResetToken"
WHERE email = 'test@example.com';
```
**預期結果**：空（令牌已刪除）

**檢查 session 是否清除**：
```sql
SELECT * FROM "Session"
WHERE "userId" = '該用戶的ID';
```
**預期結果**：空（舊 session 已清除）

---

## 測試 3: OAuth 用戶嘗試重置密碼

### 🎯 測試目標
驗證 OAuth 用戶收到友善的錯誤訊息，而非嘗試重置不存在的密碼。

### 📋 步驟

1. **使用 OAuth 登入創建用戶**（如測試1）

2. **訪問忘記密碼頁面**
   ```
   http://localhost:3000/auth/forgot-password
   ```

3. **輸入 OAuth 用戶的 email**

4. **提交表單**

5. **觀察結果**：
   - ✅ 顯示：「此帳號使用社交登入，無法重置密碼。請使用 Google 或 GitHub 登入。」
   - ✅ 不應該發送郵件
   - ✅ 不應該生成令牌

### ✅ 驗證

**檢查沒有生成令牌**：
```sql
SELECT * FROM "PasswordResetToken"
WHERE email = 'oauth_user@gmail.com';
```
**預期結果**：空

---

## 測試 4: 過期令牌處理

### 🎯 測試目標
驗證過期令牌被正確處理。

### 📋 步驟

1. **請求密碼重置**（如測試2.1）

2. **手動修改資料庫使令牌過期**：
   ```sql
   UPDATE "PasswordResetToken"
   SET expires = NOW() - INTERVAL '1 hour'
   WHERE email = 'test@example.com';
   ```

3. **訪問重置連結**

4. **嘗試重置密碼**

5. **觀察結果**：
   - ✅ 顯示：「重置令牌已過期！請重新申請密碼重置。」
   - ✅ 令牌應該被自動刪除

### ✅ 驗證

**檢查令牌已刪除**：
```sql
SELECT * FROM "PasswordResetToken"
WHERE email = 'test@example.com';
```
**預期結果**：空

---

## 測試 5: 安全性驗證

### 🎯 測試目標
驗證不洩露用戶存在性。

### 📋 步驟

1. **測試存在的 email**：
   ```
   輸入: existing@example.com
   結果: "如果該電子郵件存在，重置連結已發送！"
   ```

2. **測試不存在的 email**：
   ```
   輸入: nonexistent@example.com
   結果: "如果該電子郵件存在，重置連結已發送！"
   ```

3. **觀察結果**：
   - ✅ 訊息應該相同
   - ✅ 不應該洩露用戶是否存在

### ✅ 驗證

**檢查控制台日誌**：
- 存在的用戶：應該有郵件發送日誌
- 不存在的用戶：不應該有郵件發送日誌

---

## 🐛 常見問題排查

### OAuth 登入失敗

**問題**：點擊 OAuth 按鈕沒反應或報錯

**檢查**：
1. `.env` 檔案是否有正確的 credentials：
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

2. OAuth 回調 URL 是否正確設置：
   ```
   Google: http://localhost:3000/api/auth/callback/google
   GitHub: http://localhost:3000/api/auth/callback/github
   ```

### 密碼重置郵件未收到

**問題**：提交表單後沒收到郵件

**檢查**：
1. 開發模式下，郵件會輸出到控制台，不會真的發送
2. 檢查 `.env` 是否有 `RESEND_API_KEY`（生產環境）
3. 查看控制台日誌

### 重置後無法登入

**問題**：重置密碼後用新密碼無法登入

**檢查**：
1. 確認密碼符合強度要求
2. 檢查資料庫密碼是否更新：
   ```sql
   SELECT email, password FROM "User" WHERE email = 'test@example.com';
   ```
   - `password` 應該是哈希值，不是明文

### 角色未自動分配

**問題**：OAuth 登入後用戶沒有角色

**檢查**：
1. 資料庫是否有 `user` 角色：
   ```sql
   SELECT * FROM "Role" WHERE name = 'user';
   ```

2. 如果沒有，執行 seed：
   ```bash
   pnpm prisma db seed
   ```

---

## 📊 完整測試檢查清單

### OAuth 登入
- [ ] Google OAuth 新用戶登入
- [ ] GitHub OAuth 新用戶登入
- [ ] 用戶 status 自動設為 active
- [ ] 用戶 emailVerified 有值
- [ ] 用戶自動分配 user 角色
- [ ] 登入後正確跳轉到 dashboard
- [ ] 現有用戶 OAuth 登入自動連結
- [ ] 可以同時使用 OAuth 和密碼登入

### 密碼重置
- [ ] 登入頁面顯示「忘記密碼」連結
- [ ] 忘記密碼頁面可訪問
- [ ] 輸入 email 後顯示成功訊息
- [ ] 控制台顯示重置連結（開發模式）
- [ ] 重置頁面正確載入
- [ ] 密碼強度驗證正確
  - [ ] 太短被拒絕
  - [ ] 缺少大寫被拒絕
  - [ ] 缺少小寫被拒絕
  - [ ] 缺少數字被拒絕
  - [ ] 符合要求通過
- [ ] 密碼強度指示器顯示
- [ ] 顯示/隱藏密碼功能正常
- [ ] 密碼不一致錯誤顯示
- [ ] OAuth 用戶友善錯誤訊息
- [ ] 過期令牌正確處理
- [ ] 重置成功顯示訊息
- [ ] 2秒後自動跳轉登入頁
- [ ] 令牌使用後刪除
- [ ] 舊 session 清除
- [ ] 可以使用新密碼登入

### 安全性
- [ ] 不洩露用戶存在性
- [ ] 令牌無法猜測（UUID）
- [ ] 令牌有效期限制（1小時）
- [ ] 密碼正確哈希（bcrypt）
- [ ] Session cookies 正確設置

---

## 🎓 測試完成後

如果所有測試都通過，恭喜！你的認證系統已經：

✅ 支援 OAuth 自動帳號創建  
✅ 提供流暢的密碼重置流程  
✅ 符合 Auth.js V5 最佳實踐  
✅ 使用 React 19 / Next.js 15 最新特性  
✅ 實現了多層安全防護  

---

**測試版本**: 1.0.0  
**最後更新**: 2025-10-04
