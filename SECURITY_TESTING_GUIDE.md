# 安全修復驗證測試指南

---

## 🧪 測試 1: 驗證敏感日誌已移除

### 目標
確認 Vercel 日誌中不再輸出 AUTH_SECRET、用戶 ID、Email、角色等敏感信息

### 測試步驟

1. **訪問 Vercel 儀表板**
   - 打開 https://vercel.com/dashboard
   - 選擇你的項目
   - 進入 "Logs" 標籤

2. **清除瀏覽器 Cookies 並登入**
   ```bash
   # 或使用無痕模式
   ```

3. **檢查日誌**
   - 查找 `[Auth Config]` - 應該 ❌ 不存在
   - 查找 `[JWT Callback]` - 應該 ❌ 不存在
   - 查找 `[Session Callback]` - 應該 ❌ 不存在
   - 查找 `[Middleware]` 帶有 `tokenEmail` - 應該 ❌ 不存在

### 預期結果
✅ 沒有看到任何敏感日誌

### 失敗排查
如果仍然看到敏感日誌：
1. 確認代碼已推送到 Vercel
2. 等待 Vercel 部署完成（通常 2-5 分鐘）
3. 清除瀏覽器緩存並重新加載

---

## 🧪 測試 2: 驗證 OAuth 帳號連結安全

### 目標
確認不同 provider 的相同 Email 不會自動連結帳號

### 測試步驟

1. **使用 Google 帳號登入**
   - 訪問 https://auth.most.tw/auth/login
   - 點擊 "Sign in with Google"
   - 使用 Google 帳號登入
   - 記錄登入成功

2. **登出**
   - 點擊右上方用戶菜單
   - 選擇 "Logout"

3. **使用 GitHub 帳號登入（相同 Email）**
   - 訪問 https://auth.most.tw/auth/login
   - 點擊 "Sign in with GitHub"
   - 使用與 Google 相同 Email 的 GitHub 帳號登入

### 預期結果
✅ 創建新帳號或要求 Email 驗證，而不是自動連結到 Google 帳號

### 失敗排查
如果自動連結了帳號：
1. 檢查 `allowDangerousEmailAccountLinking` 是否為 `false`
2. 確認代碼已推送並部署
3. 清除瀏覽器 Cookies 重試

---

## 🧪 測試 3: 驗證被停權用戶無法登入

### 目標
確認被停權、禁用或刪除的帳號無法登入

### 測試步驟

1. **準備測試用戶**
   - 使用 admin@example.com 登入
   - 訪問 `/admin/users`
   - 找到一個普通用戶（例如 user@example.com）

2. **停權用戶**
   - 點擊用戶編輯按鈕
   - 將狀態改為 "Suspended"
   - 保存更改

3. **嘗試用被停權用戶登入**
   - 清除瀏覽器 Cookies（或使用無痕模式）
   - 訪問 https://auth.most.tw/auth/login
   - 輸入被停權用戶的 Email 和密碼
   - 點擊登入

### 預期結果
✅ 登入失敗，顯示錯誤消息（例如 "Invalid credentials"）

### 測試禁用用戶
重複上述步驟，但將狀態改為 "Banned"

### 失敗排查
如果被停權用戶仍能登入：
1. 檢查 `user.status` 檢查是否正確實施
2. 確認數據庫中用戶狀態已更新
3. 清除瀏覽器 Cookies 重試

---

## 🧪 測試 4: 驗證 API RBAC 檢查

### 目標
確認 `/api/roles` 和 `/api/applications` 只有 admin 可訪問

### 測試 4.1: Admin 用戶訪問

1. **以 admin 用戶登入**
   - 訪問 https://auth.most.tw/auth/login
   - 使用 admin@example.com 登入

2. **測試 /api/roles**
   - 打開瀏覽器開發者工具 (F12)
   - 在 Console 中執行：
   ```javascript
   fetch('/api/roles')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **測試 /api/applications**
   - 在 Console 中執行：
   ```javascript
   fetch('/api/applications')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

### 預期結果
✅ 兩個 API 都返回 200 OK 和數據

### 測試 4.2: 普通用戶訪問

1. **以普通用戶登入**
   - 清除瀏覽器 Cookies（或使用無痕模式）
   - 訪問 https://auth.most.tw/auth/login
   - 使用 user@example.com 登入

2. **測試 /api/roles**
   - 打開瀏覽器開發者工具 (F12)
   - 在 Console 中執行：
   ```javascript
   fetch('/api/roles')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **測試 /api/applications**
   - 在 Console 中執行：
   ```javascript
   fetch('/api/applications')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

### 預期結果
✅ 兩個 API 都返回 403 Forbidden，錯誤消息：`{ error: "Forbidden - Admin access required" }`

### 失敗排查
如果普通用戶仍能訪問：
1. 檢查 `isAdmin` 檢查是否正確實施
2. 確認 `session.user.roleNames` 正確包含角色
3. 確認代碼已推送並部署

---

## 📋 完整測試清單

### 日誌驗證
- [ ] 沒有 `[Auth Config]` 日誌
- [ ] 沒有 `[JWT Callback]` 日誌
- [ ] 沒有 `[Session Callback]` 日誌
- [ ] 沒有 `[Middleware]` 帶有 `tokenEmail` 的日誌

### OAuth 驗證
- [ ] Google 登入成功
- [ ] GitHub 登入成功
- [ ] 不同 provider 相同 Email 不自動連結

### 停權用戶驗證
- [ ] Suspended 用戶無法登入
- [ ] Banned 用戶無法登入
- [ ] Deleted 用戶無法登入
- [ ] Active 用戶仍可登入

### API 驗證
- [ ] Admin 用戶可訪問 `/api/roles` (200)
- [ ] Admin 用戶可訪問 `/api/applications` (200)
- [ ] 普通用戶無法訪問 `/api/roles` (403)
- [ ] 普通用戶無法訪問 `/api/applications` (403)
- [ ] 未登入用戶無法訪問 `/api/roles` (401)
- [ ] 未登入用戶無法訪問 `/api/applications` (401)

---

## 🐛 故障排查

### 問題：日誌仍然顯示敏感信息

**可能原因：**
1. 代碼未推送
2. Vercel 未部署最新代碼
3. 瀏覽器緩存

**解決步驟：**
1. 確認 git commit 已推送：`git log --oneline | head -5`
2. 檢查 Vercel 部署狀態
3. 清除瀏覽器緩存並重新加載

### 問題：OAuth 帳號仍自動連結

**可能原因：**
1. `allowDangerousEmailAccountLinking` 仍為 `true`
2. 代碼未部署

**解決步驟：**
1. 檢查 `auth.config.ts` 和 `auth.base.config.ts`
2. 確認 `allowDangerousEmailAccountLinking: false`
3. 重新部署

### 問題：被停權用戶仍能登入

**可能原因：**
1. `user.status` 檢查未實施
2. 用戶狀態未在數據庫中更新

**解決步驟：**
1. 檢查 `auth.config.ts` 中的 status 檢查
2. 驗證數據庫中用戶狀態
3. 清除瀏覽器 Cookies 重試

### 問題：普通用戶仍能訪問 API

**可能原因：**
1. Admin 檢查未實施
2. `session.user.roleNames` 為空

**解決步驟：**
1. 檢查 API 路由中的 admin 檢查
2. 驗證 session 中的 roleNames
3. 檢查用戶在數據庫中的角色

---

## 📊 測試報告模板

```markdown
# 安全修復驗證報告

**測試日期：** [日期]
**測試人員：** [名字]
**環境：** Production (Vercel)

## 測試結果

### 日誌驗證
- [ ] 通過 / [ ] 失敗 - 敏感日誌已移除

### OAuth 驗證
- [ ] 通過 / [ ] 失敗 - OAuth 帳號連結安全

### 停權用戶驗證
- [ ] 通過 / [ ] 失敗 - 被停權用戶無法登入

### API 驗證
- [ ] 通過 / [ ] 失敗 - API RBAC 檢查正常

## 總體結果
- [ ] 所有測試通過 ✅
- [ ] 部分測試失敗 ⚠️
- [ ] 多個測試失敗 ❌

## 備註
[記錄任何問題或觀察]
```

---

## ✅ 驗證完成

所有測試通過後，安全修復驗證完成！

建議：
1. 定期進行安全審計
2. 實現自動化安全測試
3. 監控 Vercel 日誌以檢測異常活動

