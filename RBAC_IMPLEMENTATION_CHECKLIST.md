# RBAC 實作檢查清單 & 下一步建議

## ✅ 已完成的部分

### 1. 認證層 (Authentication)
- ✅ JWT Callback 正確創建 token，包含 RBAC 數據
- ✅ Session Callback 正確更新 session，包含 roleNames、permissionNames、applicationPaths
- ✅ 用戶登入流程完整

### 2. Middleware 層 (Edge Runtime)
- ✅ Middleware 簡化為只檢查認證狀態
- ✅ 不在 middleware 中檢查 RBAC（因為 Edge Runtime 限制）
- ✅ 所有路由正確通過 middleware

### 3. Server Components 層 (RBAC 檢查)
- ✅ `/admin/layout.tsx` 正確檢查 admin 角色
- ✅ 非 admin 用戶被重定向到 `/no-access`
- ✅ Admin 用戶可以訪問所有 `/admin/*` 路由

### 4. API 路由層 (API 保護)
- ✅ 所有 `/api/admin/*` 路由使用 `checkAdminAuth()` 檢查
- ✅ 未授權用戶返回 401 Unauthorized
- ✅ 非 admin 用戶返回 403 Forbidden
- ✅ `/api/admin/stats` 正確檢查 admin 權限

### 5. 權限緩存
- ✅ 權限緩存正常工作（5 分鐘 TTL）
- ✅ 緩存命中日誌正確記錄

---

## 📋 需要驗證的事項

### 1. 用戶界面確認
請確認以下功能是否正常：

- [ ] 用戶信息是否出現在右上方面板？
- [ ] Admin 菜單是否完整顯示？
- [ ] 菜單項目是否根據用戶角色正確過濾？

### 2. 非 Admin 用戶測試
使用 `user@example.com` 登入，驗證：

- [ ] 能否訪問 `/admin`？（應該被重定向到 `/no-access`）
- [ ] 能否訪問 `/api/admin/users`？（應該返回 403）
- [ ] 能否訪問 `/dashboard`？（應該可以）

### 3. 角色更新測試
- [ ] 在數據庫中更改用戶角色
- [ ] 驗證權限是否在 5 分鐘內更新（緩存 TTL）
- [ ] 或者清除緩存後立即生效

---

## 🚀 下一步建議

### 1️⃣ 實現細粒度權限檢查（可選）

如果需要更細粒度的權限控制（例如「只有某角色可以編輯用戶」），可以：

```typescript
// lib/auth/permissionCheck.ts
export async function checkPermission(
  session: Session,
  permission: string
): Promise<boolean> {
  return session.user.permissionNames?.includes(permission) ?? false;
}

// 在 API 路由中使用
export async function PATCH(req: Request) {
  const { error, session } = await checkAdminAuth();
  if (error) return error;

  // 細粒度權限檢查
  if (!session.user.permissionNames?.includes('users.edit')) {
    return NextResponse.json(
      { error: "Forbidden - users.edit permission required" },
      { status: 403 }
    );
  }

  // ... 執行操作
}
```

### 2️⃣ 實現應用級別的訪問控制（可選）

如果有多個應用模塊，可以檢查用戶是否有訪問特定應用的權限：

```typescript
// 在 API 路由中使用
export async function GET() {
  const { error, session } = await checkAdminAuth();
  if (error) return error;

  // 檢查是否有訪問 'users' 應用的權限
  if (!session.user.applicationPaths?.includes('/admin')) {
    return NextResponse.json(
      { error: "Forbidden - No access to admin application" },
      { status: 403 }
    );
  }

  // ... 執行操作
}
```

### 3️⃣ 實現角色實時更新（可選）

如果需要角色變更立即生效（不等待 5 分鐘緩存過期）：

```typescript
// lib/auth/roleService.ts
export async function invalidateUserCache(userId: string): Promise<void> {
  permissionCache.delete(userId);
}

// 在更新用戶角色的 API 中調用
export async function PATCH(req: Request) {
  // ... 更新用戶角色
  
  // 清除緩存
  await invalidateUserCache(userId);
  
  return NextResponse.json({ success: true });
}
```

### 4️⃣ 實現動態資源級別的權限（可選）

如果需要檢查用戶是否可以訪問特定資源（例如「用戶 A 只能編輯自己的資料」）：

```typescript
// 在 API 路由中使用
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error, session } = await checkAdminAuth();
  if (error) return error;

  const { userId } = await params;

  // 檢查是否是自己或 admin
  if (session.user.id !== userId && !session.user.roleNames?.includes('admin')) {
    return NextResponse.json(
      { error: "Forbidden - Can only edit your own profile" },
      { status: 403 }
    );
  }

  // ... 執行操作
}
```

---

## 📊 當前架構總結

```
用戶登入
  ↓
JWT Callback (auth.config.ts)
  ├─ 查詢用戶角色、權限、應用
  └─ 存入 JWT token
  ↓
Session Callback (auth.config.ts)
  └─ 將 RBAC 數據存入 session
  ↓
Middleware (middleware.ts)
  ├─ 檢查認證狀態
  └─ 允許通過（RBAC 檢查在下一層）
  ↓
Server Components / API Routes
  ├─ 使用 auth() 獲取完整 session
  ├─ 檢查 roleNames、permissionNames、applicationPaths
  └─ 決定是否允許訪問
  ↓
權限緩存 (5 分鐘 TTL)
  └─ 加速重複查詢
```

---

## 🔒 安全建議

1. **不要在 Client Components 中做權限檢查** - 始終在 Server Components 或 API 路由中檢查
2. **始終驗證 session** - 不要假設用戶已認證
3. **使用 HTTPS** - 確保 JWT token 在傳輸中被加密
4. **定期更新 token** - 考慮縮短 token 壽命以提高安全性
5. **記錄訪問日誌** - 記錄所有 admin 操作以便審計

---

## 📞 常見問題

### Q: 為什麼 middleware 中看不到 roleNames？
A: 因為 Auth.js v5 在 Edge Runtime 中的 `request.auth` 只包含標準 JWT 字段。自定義字段需要在 Server Components 或 API 路由中訪問。

### Q: 如何實現角色實時更新？
A: 在更新用戶角色時，調用 `invalidateUserCache(userId)` 清除緩存，下次查詢時會重新從數據庫讀取。

### Q: 如何檢查特定權限？
A: 使用 `session.user.permissionNames?.includes('permission.name')`

### Q: 如何檢查應用訪問？
A: 使用 `session.user.applicationPaths?.includes('/admin')`

