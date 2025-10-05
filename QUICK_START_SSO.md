# 🚀 SSO 快速启动指南（5 分钟）

## 📋 前置要求

- ✅ Node.js 20+
- ✅ PostgreSQL 数据库
- ✅ pnpm 或 npm

---

## ⚡ 快速开始

### Step 1: 配置环境变量（2 分钟）

```bash
# 1. 复制环境变量示例
cp .env.example .env.local

# 2. 编辑 .env.local
nano .env.local
```

**必须配置的变量**：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"

# Auth 密钥（必须所有应用相同）
AUTH_SECRET="your-super-secret-key-min-32-chars"

# 跨子域配置（本地开发）
COOKIE_DOMAIN=.lvh.me
ALLOWED_DOMAINS=auth.lvh.me,admin.lvh.me,dashboard.lvh.me
AUTH_URL=http://auth.lvh.me:3000

# OAuth（可选）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 2: 初始化数据库（1 分钟）

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 填充初始数据
npm run seed
```

### Step 3: 启动开发服务器（1 分钟）

```bash
# 启动应用
npm run dev -- -p 3000

# 输出
✓ Ready in 1.2s
➜ Local:    http://localhost:3000
➜ Network:  http://192.168.1.100:3000
```

### Step 4: 访问并测试（1 分钟）

打开浏览器访问：

```
📍 http://auth.lvh.me:3000/auth/login  - 登录页面
📍 http://admin.lvh.me:3000/admin      - 管理后台
📍 http://dashboard.lvh.me:3000/dashboard - 仪表板
```

**测试流程**：
1. 访问 `http://admin.lvh.me:3000/admin`
2. 自动重定向到 `http://auth.lvh.me:3000/auth/login`
3. 使用测试账号登录：
   - Email: `admin@example.com`
   - Password: `Admin123`
4. 登录成功，重定向回 `http://admin.lvh.me:3000/admin`
5. 访问 `http://dashboard.lvh.me:3000/dashboard`
6. **无需再次登录** ✅ - SSO 成功！

---

## ✅ 验证 SSO 是否工作

### 检查 Cookie

1. 打开浏览器开发者工具（F12）
2. Application → Cookies → `http://admin.lvh.me:3000`
3. 应该看到：

```
Name:    authjs.session-token
Value:   xxx...xxx
Domain:  .lvh.me  👈 关键！跨子域共享
Path:    /
HttpOnly: ✅
SameSite: Lax
```

### 测试跨域登录

```bash
# Terminal 1 - 检查 Cookie
curl -v http://admin.lvh.me:3000/admin

# 应该看到 Set-Cookie header:
# Set-Cookie: authjs.session-token=...; Domain=.lvh.me; Path=/; HttpOnly
```

---

## 🔧 故障排查

### 问题 1: lvh.me 无法访问

**解决方案 A** - 检查网络
```bash
# 测试 DNS
ping lvh.me
# 应该返回 127.0.0.1
```

**解决方案 B** - 使用 /etc/hosts
```bash
# macOS/Linux
sudo nano /etc/hosts

# 添加
127.0.0.1  auth.local.dev
127.0.0.1  admin.local.dev
127.0.0.1  dashboard.local.dev

# 然后更新 .env.local
COOKIE_DOMAIN=.local.dev
ALLOWED_DOMAINS=auth.local.dev,admin.local.dev,dashboard.local.dev
```

### 问题 2: Cookie 未共享

**检查清单**：
- [ ] `COOKIE_DOMAIN` 设置为 `.lvh.me`
- [ ] 所有子域使用相同的端口（3000）
- [ ] 清除浏览器所有 Cookie 后重试
- [ ] 检查 `AUTH_SECRET` 在所有应用中相同

### 问题 3: 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
brew services list | grep postgresql

# 启动 PostgreSQL
brew services start postgresql

# 测试连接
psql -U postgres -d your_db
```

---

## 📚 下一步

### 了解更多

- 📖 [完整架构设计](./CROSS_DOMAIN_SSO_DESIGN.md)
- 📖 [本地开发详细指南](./LOCAL_DEV_SSO_SETUP.md)
- 📖 [生产环境部署](./PRODUCTION_SSO_DEPLOYMENT.md)
- 📖 [实施总结](./SSO_IMPLEMENTATION_SUMMARY.md)

### 配置 OAuth（可选）

#### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建 OAuth 2.0 凭据
3. 重定向 URI：`http://auth.lvh.me:3000/api/auth/callback/google`
4. 复制 Client ID 和 Secret 到 `.env.local`

#### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建 OAuth App
3. Callback URL：`http://auth.lvh.me:3000/api/auth/callback/github`
4. 复制 Client ID 和 Secret 到 `.env.local`

### 准备生产部署

```bash
# 1. 生成强密钥
openssl rand -base64 32

# 2. 更新生产环境变量
# COOKIE_DOMAIN=.example.com
# ALLOWED_DOMAINS=auth.example.com,admin.example.com,...
# AUTH_URL=https://auth.example.com

# 3. 部署到 Vercel
vercel --prod
```

---

## 🎯 核心概念

### Cookie Domain 的作用

```
设置 Domain=.lvh.me 后：

auth.lvh.me      ✅ 可以读取
admin.lvh.me     ✅ 可以读取
dashboard.lvh.me ✅ 可以读取
app.lvh.me       ✅ 可以读取
sub.app.lvh.me   ✅ 可以读取

other-domain.com ❌ 无法读取
```

### SSO 工作流程

```
1. 用户访问 admin.lvh.me/admin
   ↓
2. 检测无 session → 重定向到 auth.lvh.me/auth/login
   ↓
3. 用户在 auth.lvh.me 登录
   ↓
4. 设置 Cookie (Domain=.lvh.me)
   ↓
5. 重定向回 admin.lvh.me/admin
   ↓
6. admin.lvh.me 读取 Cookie → 已登录 ✅
   ↓
7. 用户访问 dashboard.lvh.me/dashboard
   ↓
8. dashboard.lvh.me 读取同一个 Cookie → 已登录 ✅
```

---

## ⚡ 常用命令

```bash
# 启动开发服务器
npm run dev -- -p 3000

# 重置数据库
npx prisma db push --force-reset

# 运行 seed
npm run seed

# 查看数据库
npx prisma studio

# 生成 Prisma Client
npx prisma generate

# 检查 TypeScript 错误
npm run type-check

# 构建生产版本
npm run build
```

---

## 🎊 成功！

如果您能看到：
- ✅ 在 `admin.lvh.me` 登录后
- ✅ 访问 `dashboard.lvh.me` 无需再次登录
- ✅ Cookie Domain 显示为 `.lvh.me`

**恭喜！SSO 已经成功运行！** 🎉

---

**创建日期**: 2025-10-05  
**预计时间**: 5 分钟  
**难度**: ⭐⭐ (简单)
