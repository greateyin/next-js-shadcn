# 錯誤處理規格書

## 1. 系統概述

本文檔詳細說明了系統的錯誤處理機制，包括前端錯誤處理、後端錯誤處理、API 錯誤處理等各個層面的錯誤處理策略和實現方式。

## 2. 錯誤類型

### 2.1 認證錯誤

```typescript
const ERROR_MESSAGES = {
  AccessDenied: 'Access Denied. Please contact support. Or try logging with Email and password.',
  OAuthAccountNotLinked:
    'Another account already exists with the same e-mail address. Please try logging in with a different provider.',
  default: 'Oops something went wrong!',
};
```

#### 錯誤分類

- 訪問拒絕
- OAuth 帳戶未關聯
- 默認錯誤

### 2.2 API 錯誤

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

#### 標準錯誤碼

- `DB_CONNECTION_ERROR`: 數據庫連接錯誤
- `USER_NOT_FOUND`: 用戶不存在
- `INVALID_CREDENTIALS`: 無效的認證信息
- `VALIDATION_ERROR`: 數據驗證錯誤
- `OPERATION_FAILED`: 操作執行失敗

## 3. 錯誤處理機制

### 3.1 前端錯誤處理

#### 表單錯誤

```typescript
const onSubmit = async (data: LoginFormData) => {
  setError(undefined);
  setSuccess(undefined);

  try {
    const result = await loginAction(data);
    if ('error' in result) {
      setError(result.error);
    } else if ('success' in result) {
      setSuccess(result.success);
    }
  } catch (error) {
    setError('An unexpected error occurred');
  }
};
```

#### 特點

- 清除之前的錯誤狀態
- 使用 try-catch 捕獲錯誤
- 顯示用戶友好的錯誤消息
- 支持成功/錯誤狀態切換

### 3.2 後端錯誤處理

#### 數據庫錯誤

```typescript
export async function loginUser(credentials: LoginCredentials): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: { loginMethods: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // ... 其他驗證邏輯
}
```

#### 特點

- 詳細的錯誤檢查
- 明確的錯誤消息
- 類型安全的錯誤處理
- 事務回滾支持

### 3.3 API 錯誤處理

#### 響應格式

```typescript
interface ErrorResponse {
  success: false;
  error: ApiError;
}
```

#### 特點

- 標準化的錯誤響應
- HTTP 狀態碼映射
- 詳細的錯誤信息
- 支持調試信息

## 4. 錯誤展示

### 4.1 錯誤組件

```typescript
const AuthErrorForm: React.FC<AuthErrorFormProps> = ({ defaultError = "An unknown error occurred" }) => {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(defaultError);

    useEffect(() => {
        if (searchParams) {
            const errorParam = searchParams.get("error");
            setError(errorParam || defaultError);
        }
    }, [searchParams, defaultError]);

    return (
        <div className="error-container">
            <p className="error-message">{error}</p>
        </div>
    );
};
```

#### 特點

- 響應式錯誤顯示
- 支持默認錯誤消息
- URL 參數錯誤處理
- 清晰的錯誤展示

### 4.2 錯誤頁面

```typescript
const AuthErrorPage: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardContent>
                    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
                        <AuthErrorForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
};
```

#### 特點

- 專門的錯誤頁面
- 優雅的加載狀態
- 響應式設計
- 用戶友好的界面

## 5. 日誌記錄

### 5.1 錯誤日誌

```typescript
error: (message: string, meta?: unknown) => {
  console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
};
```

#### 記錄內容

- 錯誤消息
- 時間戳
- 堆棧追蹤
- 上下文信息

### 5.2 日誌級別

- ERROR: 嚴重錯誤
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 調試信息

## 6. 安全考慮

### 6.1 錯誤信息安全

- 避免暴露敏感信息
- 生產環境錯誤過濾
- 錯誤消息淨化
- 安全的錯誤展示

### 6.2 錯誤追蹤

- 錯誤 ID 生成
- 錯誤關聯
- 用戶會話追蹤
- 錯誤統計

## 7. 效能考慮

### 7.1 錯誤處理效能

- 避免重複錯誤
- 錯誤緩存
- 異步錯誤處理
- 錯誤限流

### 7.2 日誌效能

- 日誌輪轉
- 日誌壓縮
- 日誌清理
- 日誌索引

## 8. 測試策略

### 8.1 錯誤測試

- 錯誤觸發測試
- 錯誤處理測試
- 錯誤展示測試
- 錯誤恢復測試

### 8.2 集成測試

- API 錯誤測試
- 前端錯誤測試
- 日誌記錄測試
- 錯誤追蹤測試

## 9. 維護與監控

### 9.1 錯誤監控

- 錯誤率監控
- 錯誤分類統計
- 錯誤趨勢分析
- 錯誤警報系統

### 9.2 維護任務

- 錯誤日誌分析
- 錯誤修復跟蹤
- 錯誤預防措施
- 錯誤處理優化
