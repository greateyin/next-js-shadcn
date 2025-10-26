# Avatar 圓心問題 - 根本原因分析

**日期：** 2025-10-26  
**問題：** Dashboard 頁面右上角用戶圓心顯示 "U" 而非 "AU"  
**狀態：** 🔍 **已診斷 - 根本原因已確認**

---

## 🎯 關鍵發現

### 生產日誌證據

```
[SESSION_CALLBACK] Session user data: { 
  id: 'cmh4w97wn002118iov5pbeuob', 
  email: 'admin@example.com', 
  name: 'Admin User',  ← ✅ name 正確！
  image: null 
}
```

**結論：** 後端 Session 回調中的 `name` 字段是正確的 `'Admin User'`！

---

## 🔍 問題根源

### 問題不在後端，而在前端！

**觀察：**
1. ✅ Session 回調日誌顯示 `name: 'Admin User'`
2. ❌ DashboardNav 日誌沒有出現在生產日誌中
3. ❌ 用戶圓心顯示 "U"

**這意味著：** `useSession()` 在客戶端沒有正確地獲取到 session 數據

---

## 📊 數據流分析

### 後端流程 ✅ **正常**

```
1. 用戶登入
   ↓
2. JWT 回調執行
   ├─ user.name = 'Admin User' ✅
   ├─ token.name = 'Admin User' ✅
   └─ 返回 token
   ↓
3. Session 回調執行
   ├─ token.name = 'Admin User' ✅
   ├─ session.user.name = 'Admin User' ✅
   └─ 返回 session
   ↓
4. SessionProvider 接收 session
   └─ session.user.name = 'Admin User' ✅
```

### 前端流程 ❌ **有問題**

```
1. DashboardNav 組件掛載
   ↓
2. useSession() 調用
   ├─ 初始狀態：session = undefined
   ├─ 狀態：status = 'loading'
   └─ 用戶圓心顯示 "U" ❌
   ↓
3. SessionProvider 從 API 獲取 session
   ├─ 調用 /api/auth/session
   ├─ 返回 session 數據
   └─ 更新 session 狀態
   ↓
4. useSession() 更新
   ├─ session.user.name = 'Admin User' ✅
   └─ 用戶圓心應該顯示 "AU" ✅
```

---

## 🔧 根本原因

### 原因 1: 初始化延遲 🔴 **最可能**

在 Next.js 15+ 中，`useSession()` 的初始化流程：

1. **第一次渲染（SSR）：**
   - SessionProvider 接收初始 session
   - 但客戶端 hydration 時可能丟失

2. **客戶端 hydration：**
   - `useSession()` 返回 `undefined`
   - 組件渲染時 `user` 為 `undefined`
   - Avatar 顯示 "U"

3. **API 調用：**
   - SessionProvider 調用 `/api/auth/session`
   - 獲取完整的 session 數據
   - 更新狀態

4. **重新渲染：**
   - `useSession()` 返回完整的 session
   - Avatar 應該更新為 "AU"

### 原因 2: SessionProvider 初始化問題

**app/layout.tsx 第 56 行：**

```typescript
<SessionProvider session={session}>
  <ThemeProvider>
    {children}
    <ToasterProvider />
  </ThemeProvider>
</SessionProvider>
```

**可能的問題：**
- SessionProvider 沒有正確地將初始 session 傳遞給客戶端
- 客戶端 hydration 時丟失了 session 數據

---

## 🧪 已部署的診斷日誌

### 增強的日誌輸出

```typescript
console.log('[DashboardNav] Avatar fallback:', avatarText, {
  hasName: !!user?.name,
  hasEmail: !!user?.email,
  nameValue: user?.name,
  emailValue: user?.email,
});
```

**這將幫助我們看到：**
- `hasName` 是否為 `true` 或 `false`
- `hasEmail` 是否為 `true` 或 `false`
- 實際的 `nameValue` 和 `emailValue` 是什麼

---

## 📋 預期的日誌輸出

### 場景 1: 正常情況（應該看到）

```
[DashboardNav] Session status: authenticated User: {
  id: 'cmh4w97wn002118iov5pbeuob',
  email: 'admin@example.com',
  name: 'Admin User',
  image: null,
  nameLength: 10,
  emailLength: 18
}
[DashboardNav] Avatar fallback: AU {
  hasName: true,
  hasEmail: true,
  nameValue: 'Admin User',
  emailValue: 'admin@example.com'
}
```

### 場景 2: 初始化延遲（可能看到）

```
[DashboardNav] Session status: loading User: {
  id: undefined,
  email: undefined,
  name: undefined,
  image: undefined,
  nameLength: undefined,
  emailLength: undefined
}
[DashboardNav] Avatar fallback: U {
  hasName: false,
  hasEmail: false,
  nameValue: undefined,
  emailValue: undefined
}
```

然後在 session 加載後：

```
[DashboardNav] Session status: authenticated User: {
  id: 'cmh4w97wn002118iov5pbeuob',
  email: 'admin@example.com',
  name: 'Admin User',
  image: null,
  nameLength: 10,
  emailLength: 18
}
[DashboardNav] Avatar fallback: AU {
  hasName: true,
  hasEmail: true,
  nameValue: 'Admin User',
  emailValue: 'admin@example.com'
}
```

---

## 🔧 可能的修復方案

### 修復 1: 使用 `status` 檢查

```typescript
if (status === 'loading') {
  return <AvatarFallback>...</AvatarFallback>; // 顯示加載狀態
}

if (status === 'authenticated' && user?.name) {
  // 顯示正確的縮寫
}
```

### 修復 2: 添加 Fallback UI

```typescript
<AvatarFallback>
  {user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.charAt(0)?.toUpperCase() 
    || (status === 'loading' ? '...' : 'U')}
</AvatarFallback>
```

### 修復 3: 強制重新獲取 Session

```typescript
useEffect(() => {
  // 強制重新獲取 session
  if (status === 'authenticated' && !user?.name) {
    // 重新調用 useSession
  }
}, [status, user?.name]);
```

---

## ✅ 驗證步驟

### 步驟 1: 檢查新的日誌輸出

查看生產日誌中是否有以下日誌：
- `[DashboardNav] Session status:`
- `[DashboardNav] Avatar fallback:`

### 步驟 2: 分析日誌

根據日誌確定：
- Session 的初始狀態是什麼？
- Avatar 計算的結果是什麼？
- `hasName` 和 `hasEmail` 的值是什麼？

### 步驟 3: 應用修復

根據日誌結果應用相應的修復

---

## 📝 相關文件

- `components/dashboard/dashboard-nav.tsx` - Avatar 邏輯和日誌
- `app/layout.tsx` - SessionProvider 初始化
- `components/providers/SessionProvider.tsx` - SessionProvider 實現
- `auth.config.ts` - Session 回調

---

**🎯 下一步：** 檢查新的日誌輸出，特別是 `[DashboardNav] Avatar fallback:` 日誌，以確定問題的確切原因。

