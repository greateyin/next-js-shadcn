# Next.js 15 + Auth.js v5 + Centralized SSO

> 🚀 **生产就绪的 Next.js 应用模板，支持跨子域单点登录（SSO）**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-green)](https://authjs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2+-2D3748)](https://www.prisma.io/)

---

## ✨ 特性

### 🔐 认证系统
- ✅ **Auth.js v5** - 最新版本的 NextAuth
- ✅ **多种登录方式** - Email/Password, Google OAuth, GitHub OAuth
- ✅ **跨子域 SSO** - 真正的单点登录
- ✅ **Database Session** - 支持全局登出
- ✅ **双因素认证** (2FA)
- ✅ **密码重置** - 安全的重置流程

### 🌐 跨子域 SSO
- ✅ **Centralized 架构** - 统一的认证中心
- ✅ **Cookie 共享** - `.example.com` 跨子域
- ✅ **OAuth 集中管理** - 单一回调 URI
- ✅ **安全重定向** - 白名单验证
- ✅ **CORS 支持** - 跨域 API 访问

### 🛡️ 权限管理
- ✅ **RBAC** - 基于角色的访问控制
- ✅ **动态权限** - 灵活的权限系统
- ✅ **应用隔离** - 多应用权限管理
- ✅ **三层防护** - Middleware + API + Server Actions

### 🎨 UI/UX
- ✅ **shadcn/ui** - 现代化 UI 组件
- ✅ **Tailwind CSS** - 实用优先的 CSS
- ✅ **响应式设计** - 移动端优化
- ✅ **深色模式** - 主题切换

### 🗄️ 数据库
- ✅ **PostgreSQL 17** - 强大的关系型数据库
- ✅ **Prisma ORM** - 类型安全的 ORM
- ✅ **自动迁移** - 数据库版本管理
- ✅ **性能优化** - 索引和查询优化

---

## 🚀 快速开始

### 前置要求

- Node.js 20+
- PostgreSQL 17+
- pnpm (推荐) 或 npm

### 5 分钟快速启动

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/next-js-shadcn.git
cd next-js-shadcn

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local

# 编辑 .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"
AUTH_SECRET="your-super-secret-key"
COOKIE_DOMAIN=.lvh.me  # 本地开发
ALLOWED_DOMAINS=auth.lvh.me,admin.lvh.me,dashboard.lvh.me

# 4. 初始化数据库
npx prisma generate
npx prisma db push
npm run seed

# 5. 启动开发服务器
npm run dev -- -p 3000

# 6. 访问应用
# http://auth.lvh.me:3000/auth/login
# http://admin.lvh.me:3000/admin
# http://dashboard.lvh.me:3000/dashboard
```

**测试 SSO**：
1. 访问 `http://admin.lvh.me:3000/admin`
2. 自动跳转到登录页
3. 登录成功后回到 admin
4. 访问 `http://dashboard.lvh.me:3000/dashboard` → **无需再次登录** ✅

详细说明请查看 **[QUICK_START_SSO.md](./QUICK_START_SSO.md)**

---

## 📚 文档

### 🎯 快速开始
- **[QUICK_START_SSO.md](./QUICK_START_SSO.md)** - 5分钟快速启动指南

### 📖 开发指南
- **[LOCAL_DEV_SSO_SETUP.md](./LOCAL_DEV_SSO_SETUP.md)** - 本地开发详细配置
- **[SSO_IMPLEMENTATION_SUMMARY.md](./SSO_IMPLEMENTATION_SUMMARY.md)** - 实施清单和使用指南

### 🏗️ 架构设计
- **[CROSS_DOMAIN_SSO_ANALYSIS.md](./CROSS_DOMAIN_SSO_ANALYSIS.md)** - 完整的 SSO 架构设计
- **[SSO_ARCHITECTURE_ANALYSIS.md](./SSO_ARCHITECTURE_ANALYSIS.md)** - Centralized vs Decentralized 对比

### 🚀 部署指南
- **[PRODUCTION_SSO_DEPLOYMENT.md](./PRODUCTION_SSO_DEPLOYMENT.md)** - 生产环境部署（Vercel/Docker）

### 🔒 安全审计
- **[SECURITY_AUDIT_2025-10-05.md](./SECURITY_AUDIT_2025-10-05.md)** - Admin API 权限修复报告

### 📝 更新日志
- **[WORK_COMPLETED_2025-10-05.md](./WORK_COMPLETED_2025-10-05.md)** - 最新工作完成总结

### 🗂️ 歷程與修復紀錄
- **[Admin 與 Dashboard 修復時間線](./document/history/admin-dashboard-timeline.md)** - 依時間整理的後台修復歷程
- **[認證流程修復時間線](./document/history/authentication-timeline.md)** - 登入與 JWT 相關的分析與修復
- **[安全性與合規修復紀錄](./document/history/security-compliance-timeline.md)** - Edge、Secrets 與稽核紀錄
- **[存取控制與角色管理紀錄](./document/history/access-control-timeline.md)** - RBAC 與使用者角色調整
- **[Avatar 與使用者體驗修復紀錄](./document/history/avatar-ux-timeline.md)** - Avatar 問題的診斷與修復
- **[營運與品質保證紀錄](./document/history/operations-quality-timeline.md)** - 測試、驗證與線上修復摘要
- **[專案變更記錄](./document/history/project-changelog.md)** - 原始 CHANGELOG 的整合版本

---

## 🏗️ 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 15, React 19 |
| **语言** | TypeScript 5.3 |
| **认证** | Auth.js v5 (NextAuth) |
| **数据库** | PostgreSQL 17, Prisma ORM 6.2 |
| **UI** | shadcn/ui 0.9.4, Tailwind CSS |
| **状态管理** | Redux Toolkit |
| **包管理** | pnpm |
| **部署** | Vercel, Docker |

---

## 📁 项目结构

```
shadcn-template-1003/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # Auth endpoints
│   │   └── admin/            # Admin APIs
│   ├── auth/                 # Auth pages (login, register, etc.)
│   ├── admin/                # Admin dashboard
│   └── dashboard/            # User dashboard
│
├── lib/                      # 工具库
│   ├── auth/                 # Auth 工具
│   │   ├── subdomain-auth.ts # 跨子域 auth 工具
│   │   └── admin-check.ts    # Admin 权限检查
│   ├── db.ts                 # Prisma client
│   └── utils.ts              # 通用工具
│
├── components/               # React 组件
│   ├── auth/                 # 认证相关组件
│   ├── admin/                # 管理后台组件
│   └── ui/                   # shadcn/ui 组件
│
├── prisma/                   # Prisma ORM
│   ├── schema.prisma         # 数据库 schema
│   └── seed.ts               # 初始数据
│
├── actions/                  # Server Actions
│   ├── auth/                 # 认证 actions
│   ├── user/                 # 用户 actions
│   └── application/          # 应用 actions
│
├── middleware.ts             # Next.js Middleware (路由保护)
├── auth.config.ts            # Auth.js 配置
└── next.config.mjs           # Next.js 配置
```

---

## 🔑 环境变量

### 必需配置

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"

# Auth 密钥（必须所有应用相同）
AUTH_SECRET="your-super-secret-key-min-32-chars"

# 跨子域配置
COOKIE_DOMAIN=.example.com         # 生产: .example.com, 本地: .lvh.me
ALLOWED_DOMAINS=auth.example.com,admin.example.com,dashboard.example.com
AUTH_URL=https://auth.example.com  # 生产: https, 本地: http://auth.lvh.me:3000

# OAuth (可选)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret
```

详细配置请查看 [.env.example](./.env.example)

---

## 🌐 SSO 架构

### Centralized 架构图

```
                    ┌─────────────────────┐
                    │  auth.example.com   │
                    │  (认证中心)          │
                    │  - OAuth 处理       │
                    │  - Session 管理     │
                    └──────────┬──────────┘
                               │
                   生成 Session Cookie
                   Domain: .example.com
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │  admin   │          │dashboard │          │ reports  │
  │  读取    │          │  读取    │          │  读取    │
  │ session  │          │ session  │          │ session  │
  └──────────┘          └──────────┘          └──────────┘
```

**工作流程**：
1. 用户访问任何子域 → 检测无登录
2. 重定向到 `auth.example.com/login`
3. 用户登录，设置 Cookie (Domain=.example.com)
4. 重定向回原子域，已登录 ✅
5. 访问其他子域，无需再次登录 ✅

---

## 🔒 安全特性

### Cookie 安全
- ✅ `HttpOnly` - 防止 XSS 攻击
- ✅ `Secure` - 仅 HTTPS 传输（生产环境）
- ✅ `SameSite=Lax` - 防止 CSRF 攻击
- ✅ `__Secure-` 前缀（生产环境）

### 权限控制
- ✅ **三层防护**
  - Middleware 路由保护
  - API 权限检查
  - Server Actions 验证

### OAuth 安全
- ✅ 集中管理（单一回调 URI）
- ✅ 重定向白名单
- ✅ State 参数验证

---

## 🧪 测试

### 本地测试

```bash
# 使用 lvh.me（无需配置 /etc/hosts）
npm run dev -- -p 3000

# 访问
http://auth.lvh.me:3000
http://admin.lvh.me:3000
http://dashboard.lvh.me:3000
```

### 测试账号

| 角色 | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123 |
| User | user@example.com | User123 |

---

## 🚀 部署

### Vercel (推荐)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Docker

```bash
# 构建镜像
docker build -t next-sso .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="..." \
  next-sso
```

详细部署指南请查看 **[PRODUCTION_SSO_DEPLOYMENT.md](./PRODUCTION_SSO_DEPLOYMENT.md)**

---

## 📈 性能

- ✅ **Database Session** - 可控的 session 管理
- ✅ **Prisma 优化** - 索引和查询优化
- ✅ **Next.js 15** - 最新性能优化
- ✅ **Static Assets** - CDN 友好

---

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)（待添加）

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)（待添加）

---

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Auth.js](https://authjs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 支持

- 📧 Email: support@example.com
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/next-js-shadcn/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/next-js-shadcn/issues)

---

**最后更新**: 2025-10-05  
**版本**: 1.0.0  
**状态**: ✅ 生产就绪
