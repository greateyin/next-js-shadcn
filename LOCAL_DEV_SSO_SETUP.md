# 🛠️ 本地开发 SSO 配置指南

## 📋 目标

在本地开发环境中模拟跨子域 SSO，实现：
- `auth.lvh.me:3000` - 认证服务器
- `admin.lvh.me:3001` - 管理后台
- `dashboard.lvh.me:3002` - 仪表板

---

## 🎯 方案选择

### 推荐：使用 lvh.me（最简单）

**lvh.me** 是一个特殊的域名，它和所有子域都自动指向 `127.0.0.1`，无需配置 hosts 文件。

```bash
# 这些域名都自动指向 localhost
auth.lvh.me → 127.0.0.1
admin.lvh.me → 127.0.0.1
dashboard.lvh.me → 127.0.0.1
anything.lvh.me → 127.0.0.1
```

---

## 🚀 快速开始

### Step 1: 配置环境变量

创建 `.env.local` 文件（基于 `.env.example`）：

```env
# .env.local

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"

# Auth 配置
AUTH_SECRET="your-super-secret-key-same-across-all-apps"
AUTH_TRUST_HOST=true
AUTH_URL=http://auth.lvh.me:3000

# 跨子域配置
COOKIE_DOMAIN=.lvh.me
ALLOWED_DOMAINS=auth.lvh.me,admin.lvh.me,dashboard.lvh.me

# OAuth (可选)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret
```

### Step 2: 启动开发服务器

```bash
# 主应用（包含 auth）
npm run dev -- -p 3000

# 访问
http://auth.lvh.me:3000
http://admin.lvh.me:3000  # 同一个应用的不同子域
http://dashboard.lvh.me:3000
```

### Step 3: 测试跨子域登录

1. 访问 `http://admin.lvh.me:3000/admin`
2. 如果未登录，会重定向到 `http://auth.lvh.me:3000/auth/login`
3. 登录后，Cookie 设置为 `Domain=.lvh.me`
4. 重定向回 `http://admin.lvh.me:3000/admin`，已登录 ✅
5. 访问 `http://dashboard.lvh.me:3000/dashboard`，无需再次登录 ✅

---

## 🔧 方案 2：使用 /etc/hosts（备选）

如果 lvh.me 不可用，可以配置 hosts 文件：

### macOS/Linux

```bash
# 编辑 /etc/hosts
sudo nano /etc/hosts

# 添加以下行
127.0.0.1  auth.local.example.com
127.0.0.1  admin.local.example.com
127.0.0.1  dashboard.local.example.com
```

### Windows

```powershell
# 以管理员身份运行记事本
notepad C:\Windows\System32\drivers\etc\hosts

# 添加以下行
127.0.0.1  auth.local.example.com
127.0.0.1  admin.local.example.com
127.0.0.1  dashboard.local.example.com
```

### 环境变量配置

```env
# .env.local
COOKIE_DOMAIN=.local.example.com
ALLOWED_DOMAINS=auth.local.example.com,admin.local.example.com,dashboard.local.example.com
AUTH_URL=http://auth.local.example.com:3000
```

---

## 🌐 多端口开发（未来：多仓库）

如果将来拆分为多个仓库，每个应用使用不同端口：

### 目录结构（未来）

```
workspace/
├── auth-server/          # 端口 3000
│   └── .env.local
│       AUTH_URL=http://auth.lvh.me:3000
│       COOKIE_DOMAIN=.lvh.me
│
├── admin-app/            # 端口 3001
│   └── .env.local
│       AUTH_URL=http://auth.lvh.me:3000
│       COOKIE_DOMAIN=.lvh.me
│
└── dashboard-app/        # 端口 3002
    └── .env.local
        AUTH_URL=http://auth.lvh.me:3000
        COOKIE_DOMAIN=.lvh.me
```

### 启动多个服务

```bash
# Terminal 1 - Auth Server
cd auth-server
npm run dev -- -p 3000

# Terminal 2 - Admin App
cd admin-app
npm run dev -- -p 3001

# Terminal 3 - Dashboard App
cd dashboard-app
npm run dev -- -p 3002
```

### 访问

```
Auth Server:  http://auth.lvh.me:3000
Admin App:    http://admin.lvh.me:3001
Dashboard:    http://dashboard.lvh.me:3002
```

**注意**：Cookie 是按 hostname 存储的，不是按端口。所以 `admin.lvh.me:3001` 和 `admin.lvh.me:3002` 会共享同一个 Cookie。

---

## 🔒 HTTPS 本地开发（可选）

如果需要测试 HTTPS（例如测试 `Secure` Cookie），可以使用 `mkcert`：

### 安装 mkcert

```bash
# macOS
brew install mkcert
mkcert -install

# 生成证书
mkcert "*.lvh.me" localhost 127.0.0.1 ::1

# 会生成两个文件
# _wildcard.lvh.me+3.pem
# _wildcard.lvh.me+3-key.pem
```

### Next.js 配置 HTTPS

```bash
# 安装 local-ssl-proxy
npm install -D local-ssl-proxy

# package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:https": "local-ssl-proxy --source 3443 --target 3000 --cert _wildcard.lvh.me+3.pem --key _wildcard.lvh.me+3-key.pem"
  }
}
```

```bash
# Terminal 1 - 启动 Next.js
npm run dev

# Terminal 2 - 启动 HTTPS 代理
npm run dev:https

# 访问
https://auth.lvh.me:3443
https://admin.lvh.me:3443
```

---

## 🧪 测试清单

### 基础功能测试

- [ ] **登录测试**
  - [ ] 访问 `http://admin.lvh.me:3000`
  - [ ] 重定向到 `http://auth.lvh.me:3000/auth/login`
  - [ ] 成功登录
  - [ ] 重定向回 `http://admin.lvh.me:3000`

- [ ] **Cookie 共享测试**
  - [ ] 在 `admin.lvh.me` 登录
  - [ ] 访问 `dashboard.lvh.me`
  - [ ] 无需再次登录 ✅

- [ ] **登出测试**
  - [ ] 在任一子域登出
  - [ ] 所有子域都应该登出

### Cookie 检查

打开浏览器开发者工具 → Application → Cookies：

```
Name: authjs.session-token (开发环境)
      __Secure-authjs.session-token (生产环境)
Domain: .lvh.me
Path: /
HttpOnly: ✅
Secure: (生产环境 ✅)
SameSite: Lax
```

---

## 🐛 常见问题

### 问题 1: Cookie 没有共享

**症状**：在 `admin.lvh.me` 登录后，访问 `dashboard.lvh.me` 仍需登录

**解决**：
1. 检查 `COOKIE_DOMAIN` 是否设置为 `.lvh.me`
2. 在浏览器中检查 Cookie 的 Domain 是否正确
3. 清除所有 Cookie 后重试

### 问题 2: 重定向到 localhost

**症状**：登录后重定向到 `localhost` 而不是 `auth.lvh.me`

**解决**：
1. 检查 `AUTH_URL` 是否正确设置
2. 检查 `ALLOWED_DOMAINS` 是否包含所有子域
3. 确认 `AUTH_TRUST_HOST=true`

### 问题 3: lvh.me 不工作

**症状**：`lvh.me` 无法访问

**解决**：
1. 检查网络是否可以访问外部 DNS
2. 尝试 `ping lvh.me`，应该返回 `127.0.0.1`
3. 如果不工作，使用方案 2（/etc/hosts）

### 问题 4: OAuth 回调失败

**症状**：Google/GitHub 登录后报错

**解决**：
OAuth 提供商的重定向 URI 需要配置：
```
Google Console: http://auth.lvh.me:3000/api/auth/callback/google
GitHub Settings: http://auth.lvh.me:3000/api/auth/callback/github
```

**注意**：某些 OAuth 提供商不允许 `lvh.me` 域名，需要使用 `localhost` 或 `127.0.0.1`

---

## 📝 环境变量对照表

| 变量 | 开发环境 | 生产环境 |
|------|---------|---------|
| `AUTH_URL` | `http://auth.lvh.me:3000` | `https://auth.example.com` |
| `COOKIE_DOMAIN` | `.lvh.me` | `.example.com` |
| `ALLOWED_DOMAINS` | `auth.lvh.me,admin.lvh.me,...` | `auth.example.com,admin.example.com,...` |
| `NODE_ENV` | `development` | `production` |

---

## 🎯 下一步

1. ✅ 确认本地 SSO 工作正常
2. ⬜ 准备生产环境配置
3. ⬜ 配置 OAuth 提供商
4. ⬜ 部署到 Vercel/其他平台

---

**最后更新**: 2025-10-05  
**适用版本**: Next.js 15+, Auth.js v5
