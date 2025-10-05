# 🌐 跨域單點登入 (SSO) 分析與建議

## 📊 現況分析

### ❌ **目前的限制**

#### 1. **CORS 配置缺失**
```javascript
// next.config.mjs - 目前沒有 CORS 配置
const nextConfig = {
  // ❌ 缺少 headers() 配置
  // ❌ 無法處理跨域請求
};
```

#### 2. **Session 架構不支援跨域**
```typescript
// auth.config.ts - 目前使用 JWT strategy
session: {
  strategy: "jwt" as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
}
```
**問題**: NextAuth 的 JWT 存儲在 HTTP-only Cookie 中，無法跨域共享

#### 3. **中間件限制**
```typescript
// middleware.ts - 只能處理單一域名
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

## 🎯 **跨域 SSO 解決方案**

### 🏗️ **架構設計**

```
┌─────────────────────────────────────────────────────┐
│                   使用者瀏覽器                       │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   App A     │  │   App B     │  │   App C     │  │
│  │ app-a.com   │  │ app-b.com   │  │ app-c.com   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │         │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
          │    CORS 請求    │                │
          └────────────────┼────────────────┘
                          ▼
                ┌─────────────────────┐
                │   SSO Auth Server   │
                │  auth.example.com   │
                │                     │
                │  - JWT 簽發/驗證     │
                │  - Token 刷新        │
                │  - Token 撤銷        │
                │  - 使用者管理        │
                └─────────────────────┘
```

### 💡 **推薦方案: OAuth 2.0 + JWT + CORS**

#### **優點:**
- ✅ 真正的跨域支援
- ✅ 無狀態 JWT Token
- ✅ 可撤銷 Token
- ✅ 細粒度權限控制
- ✅ 標準化協議

## 🔧 **實作計畫**

### **階段 1: CORS 配置 (1-2天)**

```javascript
// next.config.mjs - 新增 CORS 配置
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.ALLOWED_ORIGINS || "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type,Authorization,X-Requested-With"
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          }
        ]
      }
    ];
  }
};
```

```env
# .env.local - 新增環境變數
ALLOWED_ORIGINS=https://app-a.com,https://app-b.com,https://app-c.com
JWT_SECRET_KEY=your-rsa-private-key-here
JWT_PUBLIC_KEY=your-rsa-public-key-here
```

### **階段 2: JWT Token API (3-5天)**

#### **1. Token 簽發 API**
```typescript
// app/api/auth/token/issue/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // 驗證使用者
  const user = await validateUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  // 生成 JWT Token
  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    apps: user.allowedApps,
    aud: process.env.ALLOWED_ORIGINS?.split(','),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1小時
    iat: Math.floor(Date.now() / 1000),
    jti: generateTokenId()
  };
  
  const accessToken = await signJWT(payload);
  const refreshToken = await generateRefreshToken(user.id);
  
  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    token_type: "Bearer"
  });
}
```

#### **2. Token 驗證 API**
```typescript
// app/api/auth/token/verify/route.ts
export async function POST(request: Request) {
  const { token } = await request.json();
  
  try {
    // 檢查 Token 黑名單
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      return NextResponse.json({ error: "Token revoked" }, { status: 401 });
    }
    
    // 驗證 JWT
    const payload = await verifyJWT(token);
    
    // 檢查域名權限
    const origin = request.headers.get('origin');
    if (!payload.aud?.includes(origin)) {
      return NextResponse.json({ error: "Invalid audience" }, { status: 403 });
    }
    
    return NextResponse.json({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
```

#### **3. Token 刷新 API**
```typescript
// app/api/auth/token/refresh/route.ts
export async function POST(request: Request) {
  const { refresh_token } = await request.json();
  
  // 驗證 Refresh Token
  const refreshTokenRecord = await validateRefreshToken(refresh_token);
  if (!refreshTokenRecord) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
  
  // 獲取使用者最新資訊
  const user = await getUserById(refreshTokenRecord.userId);
  
  // 生成新的 Access Token
  const newAccessToken = await signJWT({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    apps: user.allowedApps,
    aud: process.env.ALLOWED_ORIGINS?.split(','),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    jti: generateTokenId()
  });
  
  return NextResponse.json({
    access_token: newAccessToken,
    expires_in: 3600,
    token_type: "Bearer"
  });
}
```

### **階段 3: 資料庫擴展 (1天)**

```prisma
// prisma/schema.prisma - 新增 Token 管理表

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
}

model TokenBlacklist {
  id        String   @id @default(cuid())
  jti       String   @unique  // JWT ID
  expiresAt DateTime
  reason    String?  // 撤銷原因
  createdAt DateTime @default(now())
  
  @@index([jti])
  @@index([expiresAt])
}

model UserApplication {
  id            String @id @default(cuid())
  userId        String
  applicationId String
  permissions   Json?  // 應用特定權限
  createdAt     DateTime @default(now())
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  @@unique([userId, applicationId])
}
```

### **階段 4: 客戶端 SDK (2-3天)**

```typescript
// sso-client.ts - 客戶端 SDK
class SSOClient {
  private authServer: string;
  private clientId: string;
  private redirectUri: string;
  
  constructor(config: SSOConfig) {
    this.authServer = config.authServer;
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
  }
  
  // 登入
  async login(email: string, password: string): Promise<AuthResult> {
    const response = await fetch(`${this.authServer}/api/auth/token/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, client_id: this.clientId })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const tokens = await response.json();
    
    // 存儲到 localStorage
    localStorage.setItem('sso_access_token', tokens.access_token);
    localStorage.setItem('sso_refresh_token', tokens.refresh_token);
    
    return { success: true, tokens };
  }
  
  // 驗證 Token
  async validateToken(): Promise<UserInfo | null> {
    const token = localStorage.getItem('sso_access_token');
    if (!token) return null;
    
    try {
      const response = await fetch(`${this.authServer}/api/auth/token/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.user;
      }
      
      // Token 無效，嘗試刷新
      return await this.refreshToken();
    } catch (error) {
      return null;
    }
  }
  
  // 刷新 Token
  async refreshToken(): Promise<UserInfo | null> {
    const refreshToken = localStorage.getItem('sso_refresh_token');
    if (!refreshToken) return null;
    
    try {
      const response = await fetch(`${this.authServer}/api/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (response.ok) {
        const tokens = await response.json();
        localStorage.setItem('sso_access_token', tokens.access_token);
        
        // 重新驗證新 Token
        return await this.validateToken();
      }
      
      // 刷新失敗，清除 Token
      this.logout();
      return null;
    } catch (error) {
      this.logout();
      return null;
    }
  }
  
  // 登出
  async logout(): Promise<void> {
    const token = localStorage.getItem('sso_access_token');
    if (token) {
      try {
        await fetch(`${this.authServer}/api/auth/token/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (error) {
        console.warn('Token revocation failed:', error);
      }
    }
    
    localStorage.removeItem('sso_access_token');
    localStorage.removeItem('sso_refresh_token');
  }
  
  // 檢查是否已登入
  async isAuthenticated(): Promise<boolean> {
    const user = await this.validateToken();
    return user !== null;
  }
  
  // 獲取當前使用者
  async getCurrentUser(): Promise<UserInfo | null> {
    return await this.validateToken();
  }
}

// 使用範例
const ssoClient = new SSOClient({
  authServer: 'https://auth.example.com',
  clientId: 'app-a',
  redirectUri: window.location.origin
});

// 在應用啟動時檢查登入狀態
async function initApp() {
  const isLoggedIn = await ssoClient.isAuthenticated();
  if (isLoggedIn) {
    const user = await ssoClient.getCurrentUser();
    console.log('Current user:', user);
  } else {
    // 重定向到登入頁面
    window.location.href = '/login';
  }
}
```

### **階段 5: 安全性增強 (1-2天)**

```typescript
// lib/jwt.ts - JWT 工具函數
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function signJWT(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

// Token 黑名單檢查
export async function checkTokenBlacklist(token: string): Promise<boolean> {
  const decoded = jwt.decode(token) as any;
  if (!decoded?.jti) return false;
  
  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { jti: decoded.jti }
  });
  
  return !!blacklisted;
}
```

## 📋 **實施檢查清單**

### **階段 1: 基礎配置** ⏱️ 1-2天
- [ ] 配置 CORS headers
- [ ] 設定 ALLOWED_ORIGINS 環境變數
- [ ] 生成 RSA 密鑰對
- [ ] 更新 .env.local

### **階段 2: Token API 開發** ⏱️ 3-5天
- [ ] 實作 Token 簽發 API
- [ ] 實作 Token 驗證 API
- [ ] 實作 Token 刷新 API
- [ ] 實作 Token 撤銷 API

### **階段 3: 資料庫擴展** ⏱️ 1天
- [ ] 新增 RefreshToken 模型
- [ ] 新增 TokenBlacklist 模型
- [ ] 新增 UserApplication 模型
- [ ] 執行資料庫遷移

### **階段 4: 客戶端 SDK** ⏱️ 2-3天
- [ ] 開發 SSOClient 類別
- [ ] 實作登入/登出功能
- [ ] 實作 Token 自動刷新
- [ ] 建立使用範例

### **階段 5: 測試與部署** ⏱️ 2-3天
- [ ] 單元測試
- [ ] 跨域測試
- [ ] 安全性測試
- [ ] 性能測試

## 🎯 **總結與建議**

### **✅ 需要做的改變**

| 項目 | 是否需要 | 原因 |
|------|---------|------|
| CORS 配置 | ✅ 必須 | 當前無 CORS 配置，跨域請求會被阻擋 |
| JWT 格式 | ✅ 需要 | 需添加 `aud`、`apps`、`jti` 字段 |
| Session 控管 | ✅ 需要 | 從 Cookie Session 改為 JWT Token |
| Token API | ✅ 需要 | 當前沒有獨立的 Token 簽發/驗證 API |
| 資料庫 Schema | ✅ 需要 | 需添加 Token 管理相關表格 |

### **💰 成本評估**

- **開發時間**: 10-15 天
- **複雜度**: ⭐⭐⭐⭐ (中高)
- **維護成本**: 中等
- **安全風險**: 需要專業處理

### **🚀 替代方案**

如果開發資源有限，可以考慮：

1. **使用第三方 SSO 服務** (Auth0, AWS Cognito)
2. **iframe postMessage 方案** (簡單但有限制)
3. **共享 Cookie 域名** (需要子域名架構)

### **🎯 建議**

**如果您真的需要跨域 SSO**，建議按照上述計畫實施。但請先評估：

1. 是否真的需要跨域？能否使用子域名？
2. 有多少個應用需要 SSO？
3. 安全要求有多高？
4. 開發和維護資源是否充足？

**需要我協助實作任何階段的程式碼嗎？** 🤔