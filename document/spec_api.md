# API 操作規格書

## 1. 系統概述

本文檔詳細說明了系統的 API 操作實現規格，包括用戶管理、認證操作等功能。API 操作採用 Server Actions 模式實現，確保了類型安全和效能優化。

## 2. 用戶管理操作

### 2.1 獲取用戶信息

#### getUserByEmail

```typescript
async function getUserByEmail(
  email: string,
  includeLoginMethods = false
): Promise<UserWithLoginMethods | null>;
```

- **功能**: 根據電子郵件查詢用戶信息
- **參數**:
  - email: 用戶電子郵件
  - includeLoginMethods: 是否包含登錄方式信息
- **返回**: 用戶信息對象或 null
- **錯誤處理**:
  - 數據庫連接錯誤
  - 查詢執行錯誤

#### getUserById

```typescript
async function getUserById(
  id: string,
  includeLoginMethods = false
): Promise<UserWithLoginMethods | null>;
```

- **功能**: 根據用戶 ID 查詢用戶信息
- **參數**:
  - id: 用戶唯一標識符
  - includeLoginMethods: 是否包含登錄方式信息
- **返回**: 用戶信息對象或 null
- **錯誤處理**:
  - 數據庫連接錯誤
  - 查詢執行錯誤

### 2.2 用戶註冊

```typescript
async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<UserWithLoginMethods>;
```

- **功能**: 註冊新用戶
- **參數**:
  - name: 用戶名稱
  - email: 電子郵件
  - password: 密碼
- **返回**: 創建的用戶對象
- **附加操作**:
  - 創建密碼登錄方式記錄
  - 日誌記錄
- **錯誤處理**:
  - 重複電子郵件
  - 數據驗證錯誤

### 2.3 更新用戶信息

```typescript
async function updateUser(
  id: string,
  data: Partial<UserWithLoginMethods>
): Promise<UserWithLoginMethods>;
```

- **功能**: 更新用戶信息
- **參數**:
  - id: 用戶 ID
  - data: 需要更新的用戶數據
- **返回**: 更新後的用戶對象
- **錯誤處理**:
  - 用戶不存在
  - 數據驗證錯誤

### 2.4 刪除用戶

```typescript
async function deleteUser(id: string): Promise<void>;
```

- **功能**: 刪除用戶
- **參數**: id: 用戶 ID
- **附加操作**: 級聯刪除相關數據
- **錯誤處理**:
  - 用戶不存在
  - 刪除操作錯誤

## 3. 認證操作

### 3.1 登錄操作

```typescript
async function login(credentials: { email: string; password: string }): Promise<AuthResult>;
```

- **功能**: 用戶登錄
- **參數**:
  - email: 電子郵件
  - password: 密碼
- **返回**: 認證結果
- **驗證流程**:
  1. 驗證輸入數據
  2. 檢查用戶存在
  3. 驗證密碼
  4. 檢查兩步驗證
- **錯誤處理**:
  - 無效認證信息
  - 帳號鎖定
  - 需要兩步驗證

### 3.2 登出操作

```typescript
async function logout(): Promise<void>;
```

- **功能**: 用戶登出
- **操作**:
  1. 清除會話
  2. 清除 cookies
  3. 重定向到登錄頁面

## 4. 錯誤處理

### 4.1 錯誤類型

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

### 4.2 標準錯誤碼

- `DB_CONNECTION_ERROR`: 數據庫連接錯誤
- `USER_NOT_FOUND`: 用戶不存在
- `INVALID_CREDENTIALS`: 無效的認證信息
- `VALIDATION_ERROR`: 數據驗證錯誤
- `OPERATION_FAILED`: 操作執行失敗

### 4.3 錯誤響應格式

```typescript
interface ErrorResponse {
  success: false;
  error: ApiError;
}
```

## 5. 日誌記錄

### 5.1 日誌級別

- ERROR: 錯誤信息
- WARN: 警告信息
- INFO: 操作信息
- DEBUG: 調試信息

### 5.2 日誌內容

- 時間戳
- 操作類型
- 用戶信息
- 錯誤詳情
- 堆棧追蹤（僅開發環境）

## 6. 效能考慮

### 6.1 查詢優化

- 使用索引
- 選擇性加載關聯數據
- 分頁查詢

### 6.2 緩存策略

- 用戶信息緩存
- 查詢結果緩存
- 緩存失效策略

## 7. 安全考慮

### 7.1 輸入驗證

- 使用 Zod 架構驗證
- XSS 防護
- SQL 注入防護

### 7.2 訪問控制

- 角色基礎訪問控制
- 操作權限驗證
- API 速率限制

## 8. 測試規格

### 8.1 單元測試

- 輸入驗證
- 業務邏輯
- 錯誤處理

### 8.2 整合測試

- API 端點測試
- 數據庫操作測試
- 認證流程測試

## 9. 部署考慮

### 9.1 環境配置

- 數據庫連接
- 日誌配置
- 錯誤報告

### 9.2 監控

- API 調用統計
- 錯誤率監控
- 效能指標
- 資源使用率
