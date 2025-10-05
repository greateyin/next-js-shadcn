# 🚀 生产环境 SSO 部署指南

## 📋 部署架构

```
用户访问
    ↓
┌─────────────────────────────────────────────┐
│         Cloudflare / CDN (Optional)         │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│              DNS 配置                        │
│  auth.example.com    → Vercel/Server       │
│  admin.example.com   → Vercel/Server       │
│  dashboard.example.com → Vercel/Server     │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│           Next.js 应用服务器                 │
│  - auth.example.com (Auth Server)          │
│  - admin.example.com (Admin App)           │
│  - dashboard.example.com (Dashboard App)   │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│         PostgreSQL 数据库                    │
│  (共享 Session 和用户数据)                   │
└─────────────────────────────────────────────┘
```

---

## 🌍 DNS 配置

### 方案 1: Vercel 部署

```bash
# Vercel DNS 配置
auth.example.com        CNAME  cname.vercel-dns.com
admin.example.com       CNAME  cname.vercel-dns.com
dashboard.example.com   CNAME  cname.vercel-dns.com
```

### 方案 2: 自定义服务器

```bash
# A 记录指向服务器 IP
auth.example.com        A      1.2.3.4
admin.example.com       A      1.2.3.4
dashboard.example.com   A      1.2.3.4

# 或使用负载均衡器
*.example.com           CNAME  lb.example.com
```

---

## 🔐 环境变量配置

### Auth Server (.env.production)

```env
# 数据库（共享）
DATABASE_URL="postgresql://user:password@db.example.com:5432/prod_db?sslmode=require"

# Auth 配置
AUTH_SECRET="your-production-super-secret-key-CHANGE-THIS"
AUTH_TRUST_HOST=true
AUTH_URL=https://auth.example.com

# 跨子域配置
COOKIE_DOMAIN=.example.com
ALLOWED_DOMAINS=auth.example.com,admin.example.com,dashboard.example.com,reports.example.com

# OAuth Providers
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GITHUB_ID=your_production_github_id
GITHUB_SECRET=your_production_github_secret

# 邮件服务（用于密码重置等）
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=noreply@example.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@example.com

# Node 环境
NODE_ENV=production
```

### 子应用（Admin, Dashboard）(.env.production)

```env
# 数据库（共享）
DATABASE_URL="postgresql://user:password@db.example.com:5432/prod_db?sslmode=require"

# Auth 配置（相同的 SECRET）
AUTH_SECRET="your-production-super-secret-key-CHANGE-THIS"
AUTH_TRUST_HOST=true
AUTH_URL=https://auth.example.com

# 跨子域配置
COOKIE_DOMAIN=.example.com
ALLOWED_DOMAINS=auth.example.com,admin.example.com,dashboard.example.com

# Node 环境
NODE_ENV=production
```

---

## 🔒 OAuth 配置

### Google OAuth Console

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建 OAuth 2.0 凭据
3. 授权重定向 URI：
   ```
   https://auth.example.com/api/auth/callback/google
   ```
4. 复制 Client ID 和 Client Secret

### GitHub OAuth Settings

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建 OAuth App
3. Authorization callback URL：
   ```
   https://auth.example.com/api/auth/callback/github
   ```
4. 复制 Client ID 和 Client Secret

**重要**：只需在 **auth.example.com** 配置一次回调 URI，所有子域都可以使用！

---

## 🏗️ Vercel 部署配置

### vercel.json (Auth Server)

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "AUTH_SECRET": "@auth-secret",
    "AUTH_URL": "https://auth.example.com",
    "COOKIE_DOMAIN": ".example.com",
    "ALLOWED_DOMAINS": "auth.example.com,admin.example.com,dashboard.example.com",
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret",
    "GITHUB_ID": "@github-id",
    "GITHUB_SECRET": "@github-secret"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://admin.example.com,https://dashboard.example.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,POST,PUT,DELETE,OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type,Authorization"
        }
      ]
    }
  ]
}
```

### 部署命令

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署 Auth Server
cd auth-server
vercel --prod

# 部署 Admin App
cd admin-app
vercel --prod

# 部署 Dashboard App
cd dashboard-app
vercel --prod
```

---

## 🐳 Docker 部署

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# 1. 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 2. 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js
RUN npm run build

# 3. 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:17-alpine
    container_name: sso_postgres
    environment:
      POSTGRES_DB: sso_db
      POSTGRES_USER: sso_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - sso_network

  # Auth Server
  auth-server:
    build:
      context: ./auth-server
      dockerfile: Dockerfile
    container_name: auth_server
    environment:
      DATABASE_URL: postgresql://sso_user:${DB_PASSWORD}@postgres:5432/sso_db
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: https://auth.example.com
      COOKIE_DOMAIN: .example.com
      ALLOWED_DOMAINS: ${ALLOWED_DOMAINS}
      NODE_ENV: production
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    networks:
      - sso_network

  # Admin App
  admin-app:
    build:
      context: ./admin-app
      dockerfile: Dockerfile
    container_name: admin_app
    environment:
      DATABASE_URL: postgresql://sso_user:${DB_PASSWORD}@postgres:5432/sso_db
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: https://auth.example.com
      COOKIE_DOMAIN: .example.com
      NODE_ENV: production
    depends_on:
      - postgres
      - auth-server
    ports:
      - "3001:3000"
    networks:
      - sso_network

  # Dashboard App
  dashboard-app:
    build:
      context: ./dashboard-app
      dockerfile: Dockerfile
    container_name: dashboard_app
    environment:
      DATABASE_URL: postgresql://sso_user:${DB_PASSWORD}@postgres:5432/sso_db
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: https://auth.example.com
      COOKIE_DOMAIN: .example.com
      NODE_ENV: production
    depends_on:
      - postgres
      - auth-server
    ports:
      - "3002:3000"
    networks:
      - sso_network

  # Nginx (反向代理)
  nginx:
    image: nginx:alpine
    container_name: sso_nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - auth-server
      - admin-app
      - dashboard-app
    networks:
      - sso_network

volumes:
  postgres_data:

networks:
  sso_network:
    driver: bridge
```

### Nginx 配置

```nginx
# nginx.conf
http {
    # Auth Server
    server {
        listen 443 ssl http2;
        server_name auth.example.com;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        location / {
            proxy_pass http://auth-server:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Admin App
    server {
        listen 443 ssl http2;
        server_name admin.example.com;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        location / {
            proxy_pass http://admin-app:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Dashboard App
    server {
        listen 443 ssl http2;
        server_name dashboard.example.com;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        location / {
            proxy_pass http://dashboard-app:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # HTTP to HTTPS 重定向
    server {
        listen 80;
        server_name auth.example.com admin.example.com dashboard.example.com;
        return 301 https://$server_name$request_uri;
    }
}
```

---

## 📊 监控与日志

### Vercel Analytics

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 自定义日志

```typescript
// lib/logger.ts
export function logAuthEvent(event: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    // 发送到日志服务（如 Datadog, Sentry）
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      data,
      env: 'production'
    }));
  }
}

// 使用
logAuthEvent('user_login', { userId: user.id, method: 'google' });
```

---

## 🧪 生产环境测试清单

### 部署前检查

- [ ] **环境变量**
  - [ ] 所有应用的 `AUTH_SECRET` 相同
  - [ ] `COOKIE_DOMAIN` 设置为 `.example.com`
  - [ ] `ALLOWED_DOMAINS` 包含所有子域
  - [ ] OAuth 回调 URI 配置正确

- [ ] **SSL/TLS 证书**
  - [ ] 所有子域都有有效的 HTTPS 证书
  - [ ] 证书包含所有子域（或使用通配符）

- [ ] **数据库**
  - [ ] PostgreSQL 配置正确
  - [ ] 所有应用连接到同一数据库
  - [ ] 数据库备份策略已配置

- [ ] **DNS**
  - [ ] 所有子域 DNS 记录已配置
  - [ ] TTL 值合理（建议 300-600 秒）

### 部署后测试

- [ ] **跨域登录**
  - [ ] 在 `admin.example.com` 登录
  - [ ] 访问 `dashboard.example.com` 无需再登录

- [ ] **Cookie 检查**
  - [ ] Cookie Domain 为 `.example.com`
  - [ ] Cookie 名称为 `__Secure-authjs.session-token`
  - [ ] `Secure` 和 `HttpOnly` 标志已设置

- [ ] **OAuth 登录**
  - [ ] Google 登录正常
  - [ ] GitHub 登录正常
  - [ ] 回调 URL 正确

- [ ] **登出功能**
  - [ ] 在任一子域登出
  - [ ] 所有子域都登出

---

## 🔥 紧急回滚计划

### 快速回滚（Vercel）

```bash
# 查看部署历史
vercel ls

# 回滚到上一个版本
vercel rollback
```

### 数据库回滚

```bash
# 恢复数据库备份
pg_restore -h db.example.com -U sso_user -d sso_db backup.dump
```

---

## 📈 性能优化

### CDN 配置（Cloudflare）

```javascript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### 数据库连接池

```env
# .env.production
DATABASE_URL="postgresql://user:password@db.example.com:5432/prod_db?connection_limit=10&pool_timeout=20"
```

---

## 🎯 下一步

1. ✅ 配置生产环境变量
2. ✅ 设置 DNS 记录
3. ✅ 配置 SSL 证书
4. ✅ 部署应用
5. ✅ 测试跨域 SSO
6. ✅ 配置监控和日志
7. ✅ 准备紧急回滚计划

---

**最后更新**: 2025-10-05  
**维护人员**: DevOps Team
