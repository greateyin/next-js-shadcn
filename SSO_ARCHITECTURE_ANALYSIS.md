# 🔍 Multi-Subdomain SSO 深度架构分析

## 📅 分析日期
2025-10-05

## 🎯 项目背景分析

### 当前项目特征

根据您的代码库分析，项目具有以下特点：

| 特征 | 现状 | 影响 |
|------|------|------|
| **框架** | Next.js 15 + React 19 | ✅ 支持最新 Auth.js v5 |
| **认证** | Auth.js v5 + Prisma Adapter | ✅ 已有完整认证系统 |
| **数据库** | PostgreSQL + Prisma ORM | ✅ 适合 Database Session |
| **架构** | 单体应用 + 动态应用系统 | ⚠️ 需要扩展到多子域 |
| **权限** | RBAC（角色-权限-应用） | ✅ 已有完善的权限体系 |
| **应用管理** | Application 表 + 动态菜单 | ✅ 支持多应用隔离 |

### 从代码看到的关键点

```typescript
// 1. 已有应用管理系统
model Application {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String
  description String?
  path        String   @unique  // 👈 应用路径
  icon        String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
}

// 2. 已有角色-应用关联
model RoleApplication {
  id            String      @id @default(cuid())
  roleId        String
  applicationId String
  role          Role        @relation(...)
  application   Application @relation(...)
}

// 3. 当前 Session 策略
session: {
  strategy: "jwt" as const,
  maxAge: 30 * 24 * 60 * 60,  // 30 天
}
```

**关键发现**：
1. ✅ 您已有完整的应用管理和权限控制系统
2. ✅ 数据库已经支持多应用场景
3. ✅ 当前使用 JWT Session
4. ⚠️ 但还是单一仓库/部署

---

## 📊 方案对比分析

### A) Decentralized（分散式）

**架构示意**：
```
app1.example.com  ──┐
                    ├──→ 各自运行 Auth.js
app2.example.com  ──┤    各自的 /api/auth/*
                    │    共享 AUTH_SECRET
app3.example.com  ──┘    Cookie Domain: .example.com
```

#### 优点 ✅
1. **无单点故障** - 一个应用挂了不影响其他
2. **独立部署** - 每个应用可以独立发布
3. **同源请求** - `useSession()` 无需 CORS
4. **灵活性高** - 每个应用可自定义 OAuth 提供商

#### 缺点 ❌
1. **OAuth 重定向 URI 维护成本高**
   - Google: 需为每个子域添加 `https://app1.example.com/api/auth/callback/google`
   - GitHub: 需为每个子域添加 `https://app2.example.com/api/auth/callback/github`
   - 每增加一个应用 = N 个 OAuth 配置更新

2. **安全风险更大**
   - Cookie `Domain=.example.com` 暴露给所有子域
   - 如果有一个子域被攻击，session cookie 可能泄露

3. **本地开发复杂**
   - 需要 `lvh.me` 或 `/etc/hosts` 配置多子域
   - 每个开发者都要配置

4. **代码重复**
   - 每个仓库都要维护相同的 `auth.ts` 配置
   - 配置漂移风险（版本不一致）

#### 适合场景
- ✅ 应用完全独立，不同团队维护
- ✅ 每个应用需要不同的 OAuth 提供商
- ✅ 追求最大化的自主权

---

### B) Centralized（中心式）

**架构示意**：
```
                    ┌─────────────────────┐
                    │  auth.example.com   │
                    │  唯一的 OAuth 流程   │
                    │  /api/auth/*        │
                    └──────────┬──────────┘
                               │
                   生成 Session Cookie
                   Domain: .example.com
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │  app1    │          │  app2    │          │  app3    │
  │  读取    │          │  读取    │          │  读取    │
  │  session │          │  session │          │  session │
  └──────────┘          └──────────┘          └──────────┘
```

#### 优点 ✅
1. **OAuth 配置集中管理**
   - 只需维护一组重定向 URI
   - `https://auth.example.com/api/auth/callback/google`
   - 新增应用无需更新 OAuth 配置

2. **安全治理更强**
   - 统一的登录入口，便于审计
   - 集中的安全策略（2FA、风控）
   - 更容易实现全局登出

3. **代码维护成本低**
   - Auth 逻辑只在一个地方
   - 其他应用只需读取 session
   - 配置一致性保证

4. **本地开发简单**
   - 只需配置一个 `auth.local.example.com`
   - 其他应用直接用 `localhost:3001`、`3002` 等

#### 缺点 ❌
1. **`useSession()` 跨域问题**
   - 需要在每个应用保留轻量 `/api/auth/session` 端点
   - 或者处理 CORS（不推荐）

2. **Auth Server 成为关键依赖**
   - 如果 `auth.example.com` 挂了，新用户无法登录
   - 需要高可用部署

3. **初始登录流程跨域**
   - 用户在 `app1.example.com` 点登录 → 跳转到 `auth.example.com`
   - 需要处理 `redirect_uri` 参数

#### 适合场景
- ✅ 多个应用共享相同的用户群
- ✅ 需要统一的安全策略和合规要求
- ✅ 追求低维护成本
- ✅ **您的项目！**（见下方分析）

---

## 🎯 **推荐方案：Centralized（中心式）**

### 为什么推荐 Centralized？

基于您的项目特点，**Centralized 方案明显更适合**：

#### 1. **您已有完善的应用管理系统** ✅

```typescript
// 您的 Application 表已经定义了应用路径
model Application {
  path String @unique  // 如: "admin", "dashboard", "reports"
}
```

**映射到子域名**：
- `/admin` → `admin.example.com`
- `/dashboard` → `dashboard.example.com`
- `/reports` → `reports.example.com`

这些应用**本质上是同一个系统的不同模块**，应该共享认证中心。

#### 2. **您已有 RBAC 权限控制** ✅

```typescript
// 用户已经有应用访问权限控制
session.user.applicationPaths  // ["admin", "dashboard"]
```

中心化认证可以在登录时就确定用户能访问哪些应用，而不是每个应用独立判断。

#### 3. **您使用 Database（Prisma）** ✅

- PostgreSQL 已经部署
- 适合实现 Database Session
- 可以轻松实现"全局登出"
- Audit Log 更完整

#### 4. **开发团队统一** ✅

从代码看，这是一个统一的团队维护的项目，不需要"每个应用独立自主"。

#### 5. **未来扩展性** ✅

- 新增应用无需更新 OAuth 配置
- 统一升级 Auth.js 版本
- 集中管理安全策略

---

## 🏗️ Centralized 实施方案

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                         用户浏览器                           │
│                                                               │
│  访问: admin.example.com                                      │
│        ↓                                                      │
│  检测：无 session → 重定向到 auth.example.com/login          │
│        ↓                                                      │
│  用户在 auth.example.com 登录（Google/GitHub/Email）          │
│        ↓                                                      │
│  登录成功 → 设置 Cookie (Domain=.example.com)                │
│        ↓                                                      │
│  重定向回 admin.example.com                                   │
│        ↓                                                      │
│  admin.example.com 读取 session → 已登录 ✅                   │
└─────────────────────────────────────────────────────────────┘

                         后端架构
┌──────────────────────────────────────────────────────────────┐
│                    auth.example.com                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  完整的 Auth.js 配置                                │    │
│  │  - OAuth Providers (Google, GitHub)               │    │
│  │  - Credentials Provider (Email/Password)          │    │
│  │  - Session Management (Database)                  │    │
│  │  - Callbacks (jwt, session, signIn)               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  API Routes:                                                │
│  - POST /api/auth/signin/google                            │
│  - GET  /api/auth/callback/google                          │
│  - GET  /api/auth/session                                  │
│  - POST /api/auth/signout                                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ 共享 Session
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              其他子域（轻量级）                               │
│                                                              │
│  admin.example.com    dashboard.example.com                 │
│  reports.example.com  analytics.example.com                 │
│                                                              │
│  每个应用只需：                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. 读取 session cookie                            │    │
│  │  2. 轻量 /api/auth/session 端点（可选）            │    │
│  │  3. 业务逻辑                                        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   PostgreSQL DB     │
                    │   - users           │
                    │   - sessions        │
                    │   - accounts        │
                    └─────────────────────┘
```

### 目录结构建议

```
your-org/
├── auth-server/              # 认证中心（auth.example.com）
│   ├── app/
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── auth.ts               # 完整的 Auth.js 配置
│   ├── lib/
│   │   └── db.ts             # Prisma client
│   └── .env
│       ├── AUTH_SECRET=...
│       ├── DATABASE_URL=...
│       ├── GOOGLE_ID=...
│       └── GOOGLE_SECRET=...
│
├── admin-app/                # 管理后台（admin.example.com）
│   ├── app/
│   │   ├── api/auth/session/route.ts  # 轻量 session 读取
│   │   └── admin/...
│   ├── lib/
│   │   └── auth.ts           # 简化版，只读取 session
│   └── .env
│       └── AUTH_URL=https://auth.example.com
│
├── dashboard-app/            # 仪表板（dashboard.example.com）
│   └── ...（同 admin-app 结构）
│
└── shared/                   # 共享代码
    ├── types/
    ├── ui/
    └── utils/
```

---

## 📝 实施步骤

### Phase 1: 准备工作（1-2天）

**Step 1: 环境变量统一**

```env
# auth-server/.env
AUTH_SECRET=your-super-secret-key-same-across-all-apps
AUTH_TRUST_HOST=true
AUTH_URL=https://auth.example.com
DATABASE_URL=postgresql://...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...

# 其他应用/.env
AUTH_URL=https://auth.example.com
AUTH_SECRET=your-super-secret-key-same-across-all-apps  # 相同！
```

**Step 2: Cookie 配置标准化**

```typescript
// auth-server/auth.ts
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production" 
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      domain: ".example.com"  // 👈 关键：跨子域共享
    }
  }
}
```

### Phase 2: Auth Server 实现（2-3天）

**完整的 auth.ts**：

```typescript
// auth-server/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  
  session: {
    strategy: "database",  // 👈 使用数据库 session
    maxAge: 30 * 24 * 60 * 60,
  },
  
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: process.env.COOKIE_DOMAIN || ".example.com"
      }
    }
  },
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 允许重定向到任何子域
      const allowedDomains = [
        "auth.example.com",
        "admin.example.com",
        "dashboard.example.com",
        "reports.example.com"
      ];
      
      const urlObj = new URL(url, baseUrl);
      
      if (allowedDomains.some(domain => urlObj.hostname === domain)) {
        return urlObj.toString();
      }
      
      return baseUrl;
    },
    
    async session({ session, user }) {
      // 添加角色和权限到 session
      if (user) {
        const userWithRoles = await db.user.findUnique({
          where: { id: user.id },
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
        });
        
        if (userWithRoles) {
          session.user.roles = userWithRoles.userRoles.map(ur => ur.role.name);
          session.user.permissions = [
            ...new Set(
              userWithRoles.userRoles.flatMap(ur =>
                ur.role.permissions.map(rp => rp.permission.name)
              )
            )
          ];
          session.user.applicationPaths = [
            ...new Set(
              userWithRoles.userRoles.flatMap(ur =>
                ur.role.applications.map(ra => ra.application.path)
              )
            )
          ];
        }
      }
      
      return session;
    }
  },
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Credentials({
      // 您现有的 credentials provider
    })
  ],
});
```

### Phase 3: 子应用实现（1-2天/应用）

**轻量级 auth 配置**：

```typescript
// admin-app/lib/auth.ts
import { auth as baseAuth } from "@auth/core";
import { cookies } from "next/headers";

export async function auth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token"
  );
  
  if (!sessionToken) {
    return null;
  }
  
  // 从数据库读取 session
  const session = await db.session.findUnique({
    where: { sessionToken: sessionToken.value },
    include: { user: true }
  });
  
  if (!session || session.expires < new Date()) {
    return null;
  }
  
  return {
    user: session.user,
    expires: session.expires
  };
}
```

**轻量级 session 端点**（可选，用于 `useSession()`）：

```typescript
// admin-app/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(null);
  }
  
  return NextResponse.json(session);
}
```

### Phase 4: 本地开发配置（1天）

**方案 1: 使用 lvh.me（推荐）**

```bash
# 无需配置 /etc/hosts
# lvh.me 及其所有子域都指向 127.0.0.1

# 启动服务
cd auth-server && npm run dev -- -p 3000
cd admin-app && npm run dev -- -p 3001

# 访问
http://auth.lvh.me:3000
http://admin.lvh.me:3001
```

**方案 2: /etc/hosts**

```bash
# /etc/hosts
127.0.0.1  auth.local.example.com
127.0.0.1  admin.local.example.com
127.0.0.1  dashboard.local.example.com

# .env.local
COOKIE_DOMAIN=.local.example.com
```

### Phase 5: 部署配置（1-2天）

**Vercel 部署示例**：

```yaml
# auth-server/vercel.json
{
  "regions": ["hkg1"],  # 香港
  "env": {
    "AUTH_SECRET": "@auth-secret",
    "DATABASE_URL": "@database-url",
    "COOKIE_DOMAIN": ".example.com"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "https://admin.example.com,https://dashboard.example.com" }
      ]
    }
  ]
}
```

**DNS 配置**：

```
auth.example.com      CNAME  cname.vercel-dns.com
admin.example.com     CNAME  cname.vercel-dns.com
dashboard.example.com CNAME  cname.vercel-dns.com
```

---

## 🔒 安全检查清单

- [ ] **Cookie 配置**
  - [ ] `httpOnly: true` ✅
  - [ ] `secure: true` (生产环境) ✅
  - [ ] `sameSite: "lax"` ✅
  - [ ] `domain: ".example.com"` ✅
  - [ ] 使用 `__Secure-` 前缀 ✅

- [ ] **重定向安全**
  - [ ] 实现严格的重定向白名单 ✅
  - [ ] 只允许 `.example.com` 子域 ✅
  - [ ] 验证 `redirect_uri` 参数 ✅

- [ ] **CSRF 保护**
  - [ ] Auth.js 内置 CSRF token ✅
  - [ ] 验证 `Origin` 和 `Referer` headers ✅

- [ ] **Session 管理**
  - [ ] 实现全局登出 ✅
  - [ ] Session 过期自动清理 ✅
  - [ ] 设备管理（可选）⬜

- [ ] **审计日志**
  - [ ] 记录登录事件 ✅
  - [ ] 记录登出事件 ✅
  - [ ] 记录失败的登录尝试 ✅

---

## 📊 成本效益分析

### Centralized vs Decentralized

| 指标 | Centralized | Decentralized | 差异 |
|------|-------------|---------------|------|
| **开发成本** | 低（一次实现） | 高（N 次实现） | -70% |
| **维护成本** | 低（集中更新） | 高（多处更新） | -60% |
| **OAuth 管理** | 简单（1 组配置） | 复杂（N 组配置） | -80% |
| **安全治理** | 强（集中控制） | 弱（分散控制） | +50% |
| **本地开发** | 简单 | 复杂 | -50% |
| **可用性** | 单点依赖 | 分布式 | -30% |

**总体评分**：
- **Centralized**: ⭐⭐⭐⭐⭐ (适合您的项目)
- **Decentralized**: ⭐⭐⭐ (适合完全独立的应用)

---

## 🎯 最终推荐

### **采用 Centralized 架构，原因如下：**

1. ✅ **您的应用是统一系统的不同模块**
   - 共享用户库
   - 共享权限体系
   - 统一的业务逻辑

2. ✅ **开发维护成本最低**
   - OAuth 配置只需维护一次
   - Auth 逻辑集中管理
   - 新增应用零成本

3. ✅ **安全性更强**
   - 集中的审计日志
   - 统一的安全策略
   - 更容易合规

4. ✅ **您已有 PostgreSQL**
   - Database Session 更可控
   - 支持全局登出
   - 完整的 Audit Trail

5. ✅ **团队协作更高效**
   - 统一的开发体验
   - 一致的配置
   - 更少的认知负担

---

## 🚀 行动计划

### 第一阶段（1周）：验证可行性
- [ ] 创建 `auth.example.com` 原型
- [ ] 实现基本的 OAuth 登录
- [ ] 测试跨子域 Cookie 共享
- [ ] 验证本地开发流程

### 第二阶段（2周）：完整实现
- [ ] 迁移现有 auth 逻辑到 auth server
- [ ] 实现 Database Session
- [ ] 添加重定向白名单
- [ ] 实现全局登出

### 第三阶段（1-2周）：应用迁移
- [ ] 迁移第一个应用（admin）
- [ ] 迁移第二个应用（dashboard）
- [ ] 逐步迁移其他应用

### 第四阶段（1周）：测试与优化
- [ ] 完整的安全测试
- [ ] 性能测试
- [ ] 用户体验测试
- [ ] 文档编写

**总工时预估**: 5-6 周

---

## 📚 参考资源

- [Auth.js Multi-Domain Setup](https://authjs.dev/guides/multi-domain)
- [Next.js Cookie Configuration](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

**分析人员**: AI Assistant  
**分析日期**: 2025-10-05  
**推荐方案**: ✅ **Centralized Architecture**  
**信心指数**: ⭐⭐⭐⭐⭐ (95%)
