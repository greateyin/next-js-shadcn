# Profile Dashboard 整合 - 快速測試指南

## 🚀 快速開始

```bash
# 1. 啟動開發伺服器
pnpm dev

# 2. 訪問
http://localhost:3000/dashboard
```

---

## ✅ 測試步驟

### 測試 1: 左側選單導航

1. **訪問 Dashboard**
   ```
   http://localhost:3000/dashboard
   ```

2. **檢查側邊欄**
   - ✅ 確認左側有側邊欄（Desktop 顯示）
   - ✅ 確認有 "Profile" 選項
   - ✅ 確認圖標為人像圖標

3. **點擊 Profile**
   - ✅ URL 變更為 `/dashboard/profile`
   - ✅ Profile 選項高亮顯示（主色調背景）
   - ✅ 頁面顯示個人資料

**預期結果**：
```
┌─────────────────┐
│ 🔲 Dashboard   │
├─────────────────┤
│   Dashboard    │
│ ▣ Profile      │ ← 高亮
│   Users        │
│   Settings     │
└─────────────────┘
```

---

### 測試 2: 頂部下拉選單

1. **點擊右上角頭像**
   - ✅ 下拉選單展開

2. **檢查選單項目**
   - ✅ 有 "Profile" 選項
   - ✅ 有 "Settings" 選項
   - ✅ 有 "Log out" 選項

3. **點擊 Profile**
   - ✅ 導航到 `/dashboard/profile`
   - ✅ 頁面顯示個人資料

---

### 測試 3: Profile 頁面內容

訪問 `/dashboard/profile` 後檢查：

#### 頁面標題
- ✅ 顯示 "My Profile"
- ✅ 顯示副標題描述
- ✅ 右上角有 "Personal Space" 徽章

#### 左側個人卡片
- ✅ 顯示用戶頭像
- ✅ 顯示用戶名稱
- ✅ 顯示電子郵件
- ✅ 顯示角色徽章
- ✅ 顯示帳號狀態
- ✅ 顯示註冊日期
- ✅ 顯示最後登入時間
- ✅ 有 "Update Account" 按鈕
- ✅ 有 "Security Settings" 按鈕

#### 右側資訊卡片

**Security Snapshot**:
- ✅ 顯示 2FA 狀態
- ✅ 顯示角色資訊
- ✅ 顯示應用程式資訊

**Quick Actions**:
- ✅ 有 "Notification Preferences" 按鈕
- ✅ 有 "Manage Login Security" 按鈕
- ✅ 有 "Privacy Settings" 按鈕

---

### 測試 4: 舊路由重定向

1. **訪問舊 URL**
   ```
   http://localhost:3000/profile
   ```

2. **預期行為**
   - ✅ 自動重定向到 `/dashboard/profile`
   - ✅ URL 欄位顯示新地址
   - ✅ 頁面內容正常顯示

---

### 測試 5: 響應式設計

#### Desktop (≥ 1024px)
- ✅ 側邊欄顯示
- ✅ 寬度固定 256px
- ✅ Profile 內容雙列佈局

#### Tablet/Mobile (< 1024px)
- ⚠️ 側邊欄隱藏（需要實作 mobile menu）
- ✅ Profile 內容單列佈局

---

### 測試 6: 權限驗證

1. **未登入狀態**
   ```
   # 登出後訪問
   http://localhost:3000/dashboard/profile
   ```
   
   **預期**：
   - ✅ 重定向到 `/auth/login`
   - ✅ URL 包含 `callbackUrl=/dashboard/profile`

2. **登入後**
   - ✅ 自動返回 `/dashboard/profile`

---

### 測試 7: 視覺樣式

#### 側邊欄
- ✅ 活躍項目有主色調背景
- ✅ 活躍項目有陰影效果
- ✅ 非活躍項目懸停有效果
- ✅ 圖標和文字對齊

#### Profile 頁面
- ✅ 卡片有適當間距
- ✅ 頭像圓形顯示
- ✅ 徽章有適當樣式
- ✅ 按鈕有懸停效果
- ✅ Grid 佈局正常

---

## 🐛 常見問題

### Q1: 側邊欄不顯示
**A**: 確認螢幕寬度 ≥ 1024px，側邊欄使用 `hidden lg:block`

### Q2: Profile 數據不顯示
**A**: 檢查：
1. 用戶是否已登入
2. 資料庫連接是否正常
3. 瀏覽器控制台是否有錯誤

### Q3: 點擊 Profile 沒反應
**A**: 檢查：
1. `next.config.js` 是否需要重啟
2. 清除瀏覽器快取
3. 檢查 JavaScript 錯誤

### Q4: 舊路由不重定向
**A**: 
1. 確認 `/app/profile/page.tsx` 檔案存在
2. 檢查檔案內容是否正確
3. 重啟開發伺服器

---

## 📊 測試檢查清單

### 功能測試
- [ ] 左側選單 Profile 可點擊
- [ ] Profile 頁面正常顯示
- [ ] 用戶資訊正確
- [ ] 頂部下拉選單有效
- [ ] 舊路由正確重定向
- [ ] 所有按鈕可點擊

### 視覺測試
- [ ] 側邊欄樣式正確
- [ ] 活躍狀態高亮
- [ ] 懸停效果正常
- [ ] 卡片佈局正確
- [ ] 響應式佈局正常

### 權限測試
- [ ] 未登入重定向到登入頁
- [ ] 登入後可訪問
- [ ] 僅顯示當前用戶資料

---

## 🎯 成功標準

全部測試通過後，您應該能夠：

✅ 從 Dashboard 左側選單訪問 Profile  
✅ 從頂部下拉選單訪問 Profile  
✅ 看到完整的個人資料資訊  
✅ 舊 `/profile` URL 自動重定向  
✅ 頁面在不同裝置上正常顯示  

---

## 📞 需要幫助？

如果測試過程中遇到問題：

1. 查看瀏覽器控制台錯誤
2. 檢查終端機伺服器日誌
3. 查閱 `document/PROFILE_DASHBOARD_INTEGRATION.md` 詳細文檔

---

**測試版本**: 1.0.0  
**最後更新**: 2025-10-04  
**預計測試時間**: 5-10 分鐘
