# Changelog - Auth 系統重構

## [2.0.0] - 2025-10-04

### 🎯 重大更新

本次更新完全重構了認證系統，實現了 OAuth 自動帳號創建和密碼重置流程優化。

---

## ✨ 新功能

### OAuth 自動帳號創建
- **一鍵登入**：使用 Google/GitHub OAuth 登入時自動創建並初始化用戶，無需額外註冊步驟
- **自動角色分配**：新 OAuth 用戶自動獲得 `user` 角色
- **郵件自動驗證**：OAuth 用戶狀態自動設為 `active`，`emailVerified` 自動設置
- **帳號自動連結**：相同 email 的 OAuth 和密碼登入自動連結

### 密碼重置系統
- **Server Actions**：使用 Next.js 15 / React 19 的 Server Actions，符合最佳實踐
- **密碼強度驗證**：
  - 最少 8 個字元
  - 必須包含大小寫字母
  - 必須包含數字
  - 即時密碼強度指示器（紅/黃/綠）
- **UX 改進**：
  - 登入頁面添加「忘記密碼」連結
  - 顯示/隱藏密碼功能
  - Toast 通知反饋
  - 重置成功自動跳轉登入頁（2秒）
- **安全增強**：
  - 重置後清除所有 session（強制重新登入）
  - OAuth 用戶友善錯誤提示
  - 不洩露用戶存在性
  - 令牌有效期限制（1小時）

---

## 🔧 技術改進

### Server Actions 遷移
- ✅ `requestPasswordResetAction` - 請求密碼重置（新）
- ✅ `resetPasswordWithTokenAction` - 重置密碼（新）
- ✅ 符合 React 19 `useActionState` API
- ✅ 保留舊版 API 以向後兼容

### Auth.js 配置優化
- ✅ 添加 `signIn` callback 處理 OAuth 用戶初始化
- ✅ `allowDangerousEmailAccountLinking: true` 啟用自動帳號連結
- ✅ 自動分配預設角色邏輯

### 組件更新
- ✅ `login-form.tsx` - 添加忘記密碼連結
- ✅ `reset-password-form.tsx` - 新建，包含密碼強度驗證
- ✅ `forgot-password/page.tsx` - 改用 Server Actions
- ✅ `reset-password/page.tsx` - 使用新表單組件

---

## 📁 新增檔案

### 組件
- `components/auth/reset-password-form.tsx` - 密碼重置表單（含強度驗證）

### 文檔
- `document/AUTH_COMPLETE_FLOW_GUIDE.md` - 完整認證流程指南
- `document/AUTH_REFACTOR_SUMMARY_2025-10-04.md` - 重構摘要
- `TEST_AUTH_FLOWS.md` - 測試指南
- `CHANGELOG_AUTH_2025-10-04.md` - 本文檔

---

## 🔄 修改檔案

### 核心配置
- `auth.config.ts` - 添加 OAuth signIn callback

### Server Actions
- `actions/auth/password-reset.ts` - 完整重構，添加新 Server Actions
- `actions/auth/index.ts` - 匯出新 actions

### 組件
- `components/auth/login-form.tsx` - 添加忘記密碼連結

### 頁面
- `app/auth/forgot-password/page.tsx` - 改用 Server Actions
- `app/auth/reset-password/page.tsx` - 使用新組件

---

## 🗑️ 可刪除檔案（可選）

以下舊版本檔案已被新版本取代，可以安全刪除：

- `components/auth/ResetPasswordForm.tsx` - 被 `reset-password-form.tsx` 取代

---

## 🔒 安全性改進

### 新增安全措施
1. **防止資訊洩露**：統一的錯誤訊息，不洩露用戶存在性
2. **OAuth 用戶保護**：檢測 OAuth 用戶並提供友善錯誤
3. **Session 清除**：密碼重置後強制重新登入
4. **令牌安全**：
   - UUID v4 無法猜測
   - 1 小時有效期
   - 使用後立即刪除
   - 過期自動清理

### 密碼安全
- 多層驗證（長度、大小寫、數字）
- 即時強度反饋
- Bcrypt 哈希
- 確認密碼一致性檢查

---

## 📊 資料庫變化

### 新增邏輯（無 Schema 變更）

**OAuth 用戶初始化**：
```sql
-- 自動執行於 OAuth 登入
UPDATE "User" 
SET status = 'active', emailVerified = NOW()
WHERE id = :userId AND status = 'pending';

INSERT INTO "UserRole" (userId, roleId)
SELECT :userId, id FROM "Role" WHERE name = 'user';
```

**密碼重置後 Session 清除**：
```sql
-- 自動執行於密碼重置成功
DELETE FROM "Session" WHERE userId = :userId;
```

---

## 🧪 測試

### 測試覆蓋

- ✅ OAuth 新用戶登入
- ✅ OAuth 現有用戶登入
- ✅ 密碼重置完整流程
- ✅ 密碼強度驗證
- ✅ OAuth 用戶重置錯誤
- ✅ 過期令牌處理
- ✅ 安全性驗證

### 測試文檔
詳見 `TEST_AUTH_FLOWS.md`

---

## 📚 文檔

### 新增文檔
1. **AUTH_COMPLETE_FLOW_GUIDE.md** - 完整流程指南
   - OAuth 自動帳號創建詳解
   - 密碼重置完整流程
   - 安全性考量
   - 測試指南

2. **AUTH_REFACTOR_SUMMARY_2025-10-04.md** - 重構摘要
   - 改進前後對比
   - 實現方式
   - 檔案變更清單

3. **TEST_AUTH_FLOWS.md** - 測試指南
   - 逐步測試指示
   - 驗證方法
   - 問題排查

### 更新文檔
- `document/REACT_19_MIGRATION.md` - 記錄 React 19 API 變更

---

## ⚡ 破壞性變更

### API 變更

**密碼重置 Server Actions**：

舊版本仍然可用（向後兼容），但建議遷移到新版本：

```typescript
// ❌ 舊版本（仍可用）
import { resetPassword, newPasswordAction } from "@/actions/auth";
await resetPassword(email);
await newPasswordAction(token, password);

// ✅ 新版本（推薦）
import { 
  requestPasswordResetAction, 
  resetPasswordWithTokenAction 
} from "@/actions/auth";

const [state, formAction] = useActionState(requestPasswordResetAction, undefined);
<form action={formAction}>...</form>
```

### 組件變更

**ResetPasswordForm**：

```typescript
// ❌ 舊版本
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// ✅ 新版本
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
```

---

## 🎯 遷移指南

### 如果您使用了舊的密碼重置 API

1. **不需要立即行動**
   - 舊版 API 仍然可用
   - 向後兼容已確保

2. **建議遷移到新版本**
   - 更好的安全性
   - 更好的 UX
   - 符合最新標準

3. **遷移步驟**
   ```typescript
   // 步驟 1: 更新導入
   import { 
     requestPasswordResetAction,
     resetPasswordWithTokenAction 
   } from "@/actions/auth";
   
   // 步驟 2: 更新表單
   const [state, formAction] = useActionState(
     requestPasswordResetAction, 
     undefined
   );
   
   // 步驟 3: 使用新組件
   <form action={formAction}>
     <input name="email" type="email" required />
     <button type="submit">發送</button>
   </form>
   ```

---

## 🐛 已知問題

無重大已知問題。

---

## 📝 下一步計劃

### 建議的未來改進

1. **登入嘗試限制**
   - 防止暴力破解
   - IP 限制
   - 帳號臨時鎖定

2. **CAPTCHA 集成**
   - Google reCAPTCHA v3
   - 多次失敗後觸發

3. **郵件模板美化**
   - 使用 React Email
   - 品牌化設計
   - 多語言支援

4. **兩因素認證 (2FA)**
   - UI 實現
   - QR code 生成
   - 備份碼

5. **Session 裝置管理**
   - 查看活動裝置
   - 遠程登出
   - 裝置通知

---

## 👥 貢獻者

- 系統架構與實現
- 文檔撰寫
- 測試驗證

---

## 📞 支援

如有問題，請查閱：
- `document/AUTH_COMPLETE_FLOW_GUIDE.md` - 完整指南
- `TEST_AUTH_FLOWS.md` - 測試指南
- `document/AUTH_V5_BEST_PRACTICES.md` - 最佳實踐

---

## 📄 授權

與專案主體相同

---

**版本**: 2.0.0  
**發布日期**: 2025-10-04  
**Auth.js**: 5.0.0-beta.29  
**Next.js**: 15.5.4  
**React**: 19.0.0
