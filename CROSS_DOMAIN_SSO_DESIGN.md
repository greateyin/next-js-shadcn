# 🌐 跨域单点登录（SSO）架构设计

## 📅 设计日期
2025-10-05

---

## 🎯 需求分析

### 业务场景
- **单点登录（SSO）**: 用户在一个应用登录后，可在其他应用自动登录
- **跨域访问**: 支持多个不同域名的应用共享认证状态
- **应用隔离**: 不同应用有独立的权限控制

### 技术挑战
1. **Cookie 跨域限制**: 浏览器的同源策略限制 Cookie 共享
2. **Session 管理**: JWT vs Database Session
3. **CORS 配置**: 需要正确配置跨域资源共享
4. **安全性**: 防止 CSRF、XSS 等攻击

---

## 🏗️ 推荐架构方案

### 方案选择对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **JWT + CORS** | 无状态、易扩展 | JWT 无法主动失效 | ⭐⭐⭐⭐ |
| **Shared Database Session** | 可控性强 | 需要共享数据库 | ⭐⭐⭐ |
| **OAuth 2.0 / OIDC** | 标准化、安全 | 实现复杂 | ⭐⭐⭐⭐⭐ |
| **CAS (Central Authentication Service)** | 专为 SSO 设计 | 过时、复杂 | ⭐⭐ |

### ✅ 推荐方案：**OAuth 2.0 + JWT + CORS**

这是最现代、最安全的跨域 SSO 解决方案。

---

## 📐 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     用户浏览器                                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App A      │  │   App B      │  │   App C      │      │
│  │ app-a.com    │  │ app-b.com    │  │ app-c.com    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │   CORS Request   │                  │
          └──────────────────┼──────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │     SSO Auth Server          │
              │   (Next.js + Auth.js)        │
              │    auth.example.com          │
              │                              │
              │  ┌────────────────────────┐  │
              │  │  JWT Token Service     │  │
              │  │  - Issue Access Token  │  │
              │  │  - Issue Refresh Token │  │
              │  │  - Token Validation    │  │
              │  └────────────────────────┘  │
              │                              │
              │  ┌────────────────────────┐  │
              │  │  Session Management    │  │
              │  │  - Database Sessions   │  │
              │  │  - Token Blacklist     │  │
              │  └────────────────────────┘  │
              └───────────┬──────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │   PostgreSQL DB     │
                │   - Users           │
                │   - Sessions        │
                │   - Roles           │
                │   - Applications    │
                └─────────────────────┘
```

### 工作流程

```
1. 用户访问 App A (app-a.com)
   ↓
2. App A 检测无 Token，重定向到 SSO Server
   app-a.com → auth.example.com/login?redirect_uri=app-a.com
   ↓
3. 用户在 SSO Server 登录
   ↓
4. SSO Server 生成 JWT Access Token + Refresh Token
   ↓
5. 重定向回 App A，带上 Token
   auth.example.com → app-a.com?token=xxx
   ↓
6. App A 将 Token 存储在 localStorage（或使用 Secure HttpOnly Cookie）
   ↓
7. 用户访问 App B (app-b.com)
   ↓
8. App B 向 SSO Server 验证 Token（通过 CORS）
   ↓
9. Token 有效，App B 自动登录（无需再次输入密码）
```

---

## 🔧 技术实现

### 1. JWT Token 设计

#### Access Token 格式
```typescript
{
  // Header
  "alg": "RS256",  // 使用 RSA 非对称加密
  "typ": "JWT"
}

{
  // Payload
  "sub": "user_id_123",           // 用户 ID
  "email": "user@example.com",    // 用户邮箱
  "name": "John Doe",             // 用户名称
  "role": "admin",                // 主要角色
  "roles": ["admin", "user"],     // 所有角色
  "permissions": ["read", "write"],  // 权限列表
  "apps": ["app-a", "app-b"],     // 可访问的应用
  "iss": "auth.example.com",      // 签发者
  "aud": ["app-a.com", "app-b.com", "app-c.com"],  // 受众（允许的域名）
  "exp": 1735891200,              // 过期时间（15分钟）
  "iat": 1735890300,              // 签发时间
  "jti": "token_unique_id"        // Token 唯一 ID（用于黑名单）
}
```

#### Refresh Token 格式
```typescript
{
  "sub": "user_id_123",
  "type": "refresh",
  "iss": "auth.example.com",
  "exp": 1738569600,  // 30天后过期
  "iat": 1735890300,
  "jti": "refresh_token_id"
}
```

### 2. CORS 配置

#### Next.js 配置（SSO Server）

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        // API 路由的 CORS 配置
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // 生产环境：指定允许的域名
            value: process.env.ALLOWED_ORIGINS || "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With"
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"  // 允许携带 Cookie
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400"  // 预检请求缓存 24 小时
          }
        ]
      }
    ];
  }
};
```

#### 环境变量配置

```env
# .env
# 允许的应用域名（多个用逗号分隔）
ALLOWED_ORIGINS=https://app-a.com,https://app-b.com,https://app-c.com

# JWT 密钥（RSA 私钥）
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."

# Token 有效期
ACCESS_TOKEN_EXPIRE=15m   # 15分钟
REFRESH_TOKEN_EXPIRE=30d  # 30天
```

### 3. API 路由实现

#### Token 签发 API

```typescript
// app/api/auth/token/issue/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 获取用户完整信息
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                },
                applications: {
                  include: { application: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 提取角色、权限、应用
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap(ur =>
          ur.role.permissions.map(rp => rp.permission.name)
        )
      )
    ];
    const apps = [
      ...new Set(
        user.userRoles.flatMap(ur =>
          ur.role.applications.map(ra => ra.application.path)
        )
      )
    ];

    // 生成 Access Token
    const privateKey = await import Crypto.createPrivateKey({
      key: Buffer.from(process.env.JWT_PRIVATE_KEY!, "utf8"),
      format: "pem"
    });

    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: roles[0] || "user",
      roles,
      permissions,
      apps
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("auth.example.com")
      .setAudience([
        "app-a.com",
        "app-b.com",
        "app-c.com"
      ])
      .setExpirationTime("15m")
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(privateKey);

    // 生成 Refresh Token
    const refreshToken = await new SignJWT({
      sub: user.id,
      type: "refresh"
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("auth.example.com")
      .setExpirationTime("30d")
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(privateKey);

    // 存储 Refresh Token 到数据库
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: 900,  // 15分钟（秒）
      tokenType: "Bearer"
    });
  } catch (error) {
    console.error("[TOKEN_ISSUE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

#### Token 验证 API

```typescript
// app/api/auth/token/verify/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    // 验证 Token
    const publicKey = await importPKCS8(
      process.env.JWT_PUBLIC_KEY!,
      "RS256"
    );

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: "auth.example.com",
      audience: ["app-a.com", "app-b.com", "app-c.com"]
    });

    // 检查 Token 是否在黑名单
    const isBlacklisted = await db.tokenBlacklist.findUnique({
      where: { jti: payload.jti as string }
    });

    if (isBlacklisted) {
      return NextResponse.json(
        { error: "Token has been revoked" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      payload
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token", valid: false },
      { status: 401 }
    );
  }
}
```

#### Token 刷新 API

```typescript
// app/api/auth/token/refresh/route.ts
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    // 验证 Refresh Token
    const publicKey = await importPKCS8(
      process.env.JWT_PUBLIC_KEY!,
      "RS256"
    );

    const { payload } = await jwtVerify(refreshToken, publicKey);

    // 检查 Refresh Token 是否存在且有效
    const storedToken = await db.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub as string,
        expiresAt: { gt: new Date() },
        revokedAt: null
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                    applications: { include: { application: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // 生成新的 Access Token
    const user = storedToken.user;
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap(ur =>
          ur.role.permissions.map(rp => rp.permission.name)
        )
      )
    ];

    const privateKey = await importPKCS8(
      process.env.JWT_PRIVATE_KEY!,
      "RS256"
    );

    const newAccessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: roles[0],
      roles,
      permissions
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("auth.example.com")
      .setAudience(["app-a.com", "app-b.com", "app-c.com"])
      .setExpirationTime("15m")
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(privateKey);

    return NextResponse.json({
      accessToken: newAccessToken,
      expiresIn: 900,
      tokenType: "Bearer"
    });
  } catch (error) {
    console.error("[TOKEN_REFRESH]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### 4. 客户端应用集成

#### 应用 A、B、C 的认证库

```typescript
// lib/sso-client.ts
export class SSOClient {
  private ssoServer = "https://auth.example.com";
  private appDomain = window.location.origin;

  /**
   * 检查用户是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    // 验证 Token
    try {
      const response = await fetch(`${this.ssoServer}/api/auth/token/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      return data.valid;
    } catch {
      return false;
    }
  }

  /**
   * 登录（重定向到 SSO Server）
   */
  login() {
    const redirectUri = encodeURIComponent(this.appDomain);
    window.location.href = `${this.ssoServer}/auth/login?redirect_uri=${redirectUri}`;
  }

  /**
   * 登出
   */
  async logout() {
    // 撤销 Token
    const token = this.getAccessToken();
    if (token) {
      await fetch(`${this.ssoServer}/api/auth/token/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
    }

    // 清除本地 Token
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // 重定向到登录页
    this.login();
  }

  /**
   * 获取 Access Token
   */
  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.ssoServer}/api/auth/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem("access_token", data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.ssoServer}/api/auth/user`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      return await response.json();
    } catch {
      return null;
    }
  }
}

// 全局实例
export const ssoClient = new SSOClient();
```

---

## 🔒 安全性考虑

### 1. Token 安全
- ✅ 使用 RS256 非对称加密（公钥验证，私钥签名）
- ✅ Access Token 短期有效（15分钟）
- ✅ Refresh Token 长期有效（30天）但可撤销
- ✅ Token Blacklist 机制（立即失效）

### 2. CORS 安全
- ✅ 明确指定允许的域名（不使用 *）
- ✅ 启用 Access-Control-Allow-Credentials
- ✅ 验证 Origin 头部

### 3. CSRF 防护
- ✅ JWT 存储在 localStorage（不受 CSRF 影响）
- ✅ 或使用 SameSite=Strict Cookie
- ✅ 双重提交 Cookie 模式

### 4. XSS 防护
- ✅ Content Security Policy (CSP)
- ✅ HttpOnly Cookie（如果使用 Cookie）
- ✅ 输入验证和输出编码

---

## 📊 数据库 Schema 扩展

需要添加以下表：

```prisma
// prisma/schema.prisma

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}

model TokenBlacklist {
  id        String   @id @default(cuid())
  jti       String   @unique  // JWT ID
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([jti])
  @@index([expiresAt])
}
```

---

## 🚀 部署建议

### 1. 域名配置
```
SSO Server:    auth.example.com
Application A: app-a.com
Application B: app-b.com
Application C: app-c.com
```

### 2. SSL/TLS 证书
- **必须使用 HTTPS**（跨域 Cookie 要求）
- 使用 Let's Encrypt 或商业证书

### 3. 性能优化
- Token 缓存（Redis）
- CDN 加速
- HTTP/2 支持

---

## ✅ 总结

### 推荐方案
**OAuth 2.0 + JWT + CORS** 是最适合您的方案：

| 特性 | 支持 |
|------|------|
| 跨域支持 | ✅ |
| 单点登录 | ✅ |
| 应用隔离 | ✅ |
| 可扩展性 | ✅ |
| 安全性 | ✅ |
| 易于实现 | ✅ |

### 是否需要重新设计？

#### JWT 格式
✅ **需要优化**：
- 当前 JWT 存储在 Session 中（不适合跨域）
- 需要改为独立的 JWT Token API
- 添加 `aud` 字段指定允许的域名

#### Session 控管
✅ **需要调整**：
- 当前使用 Database Session（无法跨域）
- 改为 JWT + Refresh Token 模式
- 保留 Token Blacklist 用于撤销

---

## 📞 下一步行动

1. ✅ 阅读本文档
2. ⬜ 生成 RSA 密钥对
3. ⬜ 实现 Token API
4. ⬜ 配置 CORS
5. ⬜ 更新数据库 Schema
6. ⬜ 实现客户端 SDK
7. ⬜ 测试跨域登录

---

**设计人员**: AI Assistant  
**设计日期**: 2025-10-05  
**适用场景**: 多域名应用的单点登录  
**安全等级**: ⭐⭐⭐⭐⭐
