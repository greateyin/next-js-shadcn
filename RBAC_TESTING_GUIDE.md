# RBAC 測試指南

## 🧪 測試場景

### 場景 1: Admin 用戶訪問 Admin 路由

**測試步驟：**
1. 清除瀏覽器 Cookies（或使用無痕模式）
2. 訪問 `https://auth.most.tw/auth/login`
3. 使用 `admin@example.com` / `Admin@123` 登入
4. 訪問 `https://auth.most.tw/admin`

**預期結果：**
- ✅ 成功訪問 `/admin` 頁面
- ✅ 看到 Admin 儀表板
- ✅ 菜單顯示所有 admin 選項
- ✅ 用戶信息出現在右上方面板

**Vercel 日誌預期：**
```
[Session Callback] Session updated: { userId: '...', email: 'admin@example.com', roleNames: [ 'admin' ], ... }
[Middleware] Request: { pathname: '/admin', isAuthenticated: true, hasToken: true }
[PermissionCache] Cached permissions for user: ...
```

---

### 場景 2: 非 Admin 用戶訪問 Admin 路由

**測試步驟：**
1. 清除瀏覽器 Cookies（或使用無痕模式）
2. 訪問 `https://auth.most.tw/auth/login`
3. 使用 `user@example.com` / `User@123` 登入
4. 訪問 `https://auth.most.tw/admin`

**預期結果：**
- ✅ 被重定向到 `/no-access` 頁面
- ✅ 看到「無權限訪問」的消息
- ✅ 不能訪問任何 admin 功能

**Vercel 日誌預期：**
```
[Session Callback] Session updated: { userId: '...', email: 'user@example.com', roleNames: [ 'user' ], ... }
[Middleware] Request: { pathname: '/admin', isAuthenticated: true, hasToken: true }
// 然後被 /admin/layout.tsx 重定向到 /no-access
```

---

### 場景 3: 未登入用戶訪問 Admin 路由

**測試步驟：**
1. 清除瀏覽器 Cookies（或使用無痕模式）
2. 直接訪問 `https://auth.most.tw/admin`

**預期結果：**
- ✅ 被重定向到 `/auth/login`
- ✅ 看到登入頁面
- ✅ 登入後被重定向回 `/admin`（如果是 admin）或 `/no-access`（如果不是 admin）

**Vercel 日誌預期：**
```
[Middleware] Request: { pathname: '/admin', isAuthenticated: false, hasToken: false }
// 被 middleware 重定向到 /auth/login
```

---

### 場景 4: Admin 用戶訪問 API 路由

**測試步驟：**
1. 以 `admin@example.com` 登入
2. 打開瀏覽器開發者工具 (F12)
3. 在 Console 中執行：
```javascript
fetch('/api/admin/users')
  .then(r => r.json())
  .then(d => console.log(d))
```

**預期結果：**
- ✅ 返回 200 OK
- ✅ 返回用戶列表

**Vercel 日誌預期：**
```
GET 200 /api/admin/users
[Session Callback] Session updated: { userId: '...', roleNames: [ 'admin' ], ... }
```

---

### 場景 5: 非 Admin 用戶訪問 API 路由

**測試步驟：**
1. 以 `user@example.com` 登入
2. 打開瀏覽器開發者工具 (F12)
3. 在 Console 中執行：
```javascript
fetch('/api/admin/users')
  .then(r => r.json())
  .then(d => console.log(d))
```

**預期結果：**
- ✅ 返回 403 Forbidden
- ✅ 返回錯誤消息：`{ error: "Forbidden - Admin access required" }`

**Vercel 日誌預期：**
```
GET 403 /api/admin/users
[Session Callback] Session updated: { userId: '...', roleNames: [ 'user' ], ... }
```

---

### 場景 6: 未登入用戶訪問 API 路由

**測試步驟：**
1. 清除瀏覽器 Cookies（或使用無痕模式）
2. 打開瀏覽器開發者工具 (F12)
3. 在 Console 中執行：
```javascript
fetch('/api/admin/users')
  .then(r => r.json())
  .then(d => console.log(d))
```

**預期結果：**
- ✅ 返回 401 Unauthorized
- ✅ 返回錯誤消息：`{ error: "Unauthorized - Please login" }`

**Vercel 日誌預期：**
```
GET 401 /api/admin/users
```

---

## 🔍 驗證清單

### 認證流程
- [ ] Admin 用戶可以登入
- [ ] 非 Admin 用戶可以登入
- [ ] 登入後被重定向到正確的頁面
- [ ] 登出後無法訪問受保護的路由

### 頁面訪問控制
- [ ] Admin 用戶可以訪問 `/admin`
- [ ] 非 Admin 用戶被重定向到 `/no-access`
- [ ] 未登入用戶被重定向到 `/auth/login`
- [ ] 所有 `/admin/*` 子路由都受保護

### API 訪問控制
- [ ] Admin 用戶可以訪問 `/api/admin/*`
- [ ] 非 Admin 用戶收到 403 Forbidden
- [ ] 未登入用戶收到 401 Unauthorized
- [ ] 所有 `/api/admin/*` 路由都受保護

### 用戶界面
- [ ] 用戶信息出現在右上方面板
- [ ] Admin 菜單完整顯示
- [ ] 菜單項目根據用戶角色正確過濾
- [ ] 無權限時顯示適當的消息

### 權限緩存
- [ ] 首次訪問時查詢數據庫
- [ ] 後續訪問使用緩存
- [ ] 緩存日誌正確記錄
- [ ] 5 分鐘後緩存過期

---

## 📊 測試結果記錄

### 測試日期：_____________

| 場景 | 預期結果 | 實際結果 | 狀態 | 備註 |
|------|--------|--------|------|------|
| 1. Admin 訪問 /admin | ✅ 成功 | | [ ] | |
| 2. 非 Admin 訪問 /admin | ✅ 403 | | [ ] | |
| 3. 未登入訪問 /admin | ✅ 重定向 | | [ ] | |
| 4. Admin 訪問 API | ✅ 200 | | [ ] | |
| 5. 非 Admin 訪問 API | ✅ 403 | | [ ] | |
| 6. 未登入訪問 API | ✅ 401 | | [ ] | |

---

## 🐛 故障排查

### 問題：Admin 用戶無法訪問 /admin

**可能原因：**
1. Session 中沒有 roleNames
2. /admin/layout.tsx 中的角色檢查邏輯有誤
3. 用戶在數據庫中沒有 admin 角色

**解決步驟：**
1. 檢查 Vercel 日誌中的 Session Callback 輸出
2. 驗證 roleNames 是否包含 'admin'
3. 檢查數據庫中用戶的角色

### 問題：非 Admin 用戶可以訪問 /admin

**可能原因：**
1. /admin/layout.tsx 中的角色檢查邏輯有誤
2. 用戶被錯誤地分配了 admin 角色
3. 緩存中的舊數據

**解決步驟：**
1. 檢查 /admin/layout.tsx 中的 hasAdminAccess 邏輯
2. 驗證數據庫中用戶的角色
3. 清除瀏覽器 Cookies 並重新登入

### 問題：API 路由返回 500 錯誤

**可能原因：**
1. checkAdminAuth() 中的錯誤
2. 數據庫查詢失敗
3. Session 為 null

**解決步驟：**
1. 檢查 Vercel 日誌中的錯誤消息
2. 驗證數據庫連接
3. 檢查 auth() 函數是否正確返回 session

---

## 📝 測試報告模板

```markdown
# RBAC 測試報告

**測試日期：** 2025-10-25
**測試人員：** [名字]
**環境：** Production (Vercel)

## 測試結果

### ✅ 通過的測試
- Admin 用戶可以訪問 /admin
- Admin 用戶可以訪問 API 路由
- ...

### ❌ 失敗的測試
- [描述失敗的測試]
- ...

### ⚠️ 需要改進的地方
- [描述需要改進的地方]
- ...

## 建議

[提供改進建議]
```

