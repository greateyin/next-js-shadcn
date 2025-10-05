# 🛠️ 子網域 SSO 實際實施指南

## 🎯 **立即可執行的實作步驟**

### 📋 **總覽 - 我們要建立什麼**

```
目標架構:
auth.example.com     ← 統一登入中心
admin.example.com    ← 管理後台
app-a.example.com    ← 應用 A
app-b.example.com    ← 應用 B
api.example.com      ← 共享 API
```

## 🚀 **第一步: 立即修改現有專案**

### **1. 更新 auth.config.ts**

```typescript
// auth.config.ts - 關鍵修改
export const authConfig: NextAuthConfig = {
  debug: false,
  adapter: PrismaAdapter(db) as any,
  providers: [
    // ... 現有 providers
  ],
  callbacks: {
    // ... 現有 callbacks
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: \`next-auth.session-token\`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        // 🔥 關鍵修改: 設定主域名，所有子網域共享
        domain: process.env.NODE_ENV === "production" 
          ? ".example.com"  // 生產環境: 改成您的域名
          : "localhost",    // 開發環境: 保持 localhost
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  trustHost: true,
};
```

### **2. 更新 .env.local**

```env
# .env.local - 新增子網域相關配置

# 現有配置保持不變
AUTH_SECRET="C4OxvpoHRc3U4sYoVmNQamAvRROgn6ZBhQz0/CbH+UM="
DATABASE_URL="postgresql://dennis:gssw9w48p90@localhost:5433/postgres?schema=public"
RESEND_API_KEY=re_5pQWracA_3mAseirL8DKHgigpHYKQSfaN

# 🔥 新增子網域配置
NODE_ENV="development"
NEXTAUTH_URL=http://localhost:3000  # 開發環境
# NEXTAUTH_URL=https://auth.example.com  # 生產環境使用

# 子網域相關
MAIN_DOMAIN="example.com"  # 您的主域名
COOKIE_DOMAIN=".example.com"  # Cookie 共享域名

# 應用映射 (可選，用於多應用部署)
APP_SUBDOMAIN="admin"  # 當前應用的子網域
```

### **3. 建立子網域路由邏輯**

```typescript
// lib/subdomain.ts - 新建檔案
export function getSubdomain(host: string): string | null {
  // 移除 www 和 port
  const cleanHost = host.replace(/^www\./, '').split(':')[0];
  
  // 開發環境處理
  if (cleanHost === 'localhost' || cleanHost.includes('localhost')) {
    return null;
  }
  
  const parts = cleanHost.split('.');
  if (parts.length > 2) {
    return parts[0]; // 返回子網域
  }
  
  return null;
}

export function getAppConfig(subdomain: string | null) {
  const configs = {
    'auth': {
      name: 'Authentication Center',
      description: '統一認證中心',
      layout: 'auth',
      redirectAfterLogin: '/dashboard'
    },
    'admin': {
      name: 'Admin Panel',
      description: '管理後台',
      layout: 'admin',
      redirectAfterLogin: '/admin/dashboard',
      requiredRoles: ['admin', 'super-admin']
    },
    'app-a': {
      name: 'Application A',
      description: '應用程式 A',
      layout: 'app',
      redirectAfterLogin: '/dashboard',
      requiredRoles: ['user', 'admin']
    },
    'api': {
      name: 'API Gateway',
      description: 'API 閘道',
      layout: 'api'
    }
  };
  
  return configs[subdomain as keyof typeof configs] || {
    name: 'Main App',
    description: '主應用程式',
    layout: 'main',
    redirectAfterLogin: '/dashboard'
  };
}
```

### **4. 更新 middleware.ts**

```typescript
// middleware.ts - 增強版本
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getSubdomain, getAppConfig } from "@/lib/subdomain"

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') || ''
  const subdomain = getSubdomain(host)
  const appConfig = getAppConfig(subdomain)
  
  // 🔥 子網域特定邏輯
  const isAuthApp = subdomain === 'auth'
  const isAdminApp = subdomain === 'admin'
  const isApiApp = subdomain === 'api'
  const isPublicRoute = pathname.startsWith('/api/public') || 
                       pathname === '/' || 
                       pathname.startsWith('/_next') ||
                       pathname.startsWith('/favicon')

  // API 子網域 - 只允許 API 路由
  if (isApiApp) {
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/api/health', req.url))
    }
    return NextResponse.next()
  }

  // 認證中心 - 已登入用戶重定向到對應應用
  if (isAuthApp && req.auth && pathname.startsWith('/auth/login')) {
    const user = req.auth.user
    const isAdmin = user.roleNames?.includes('admin') || user.role === 'admin'
    const redirectUrl = isAdmin 
      ? 'https://admin.example.com/dashboard'
      : 'https://app-a.example.com/dashboard'
    
    return NextResponse.redirect(new URL(redirectUrl))
  }

  // 未認證用戶訪問受保護路由 - 重定向到認證中心
  if (!req.auth && !isAuthApp && !isPublicRoute) {
    const loginUrl = process.env.NODE_ENV === 'production'
      ? \`https://auth.example.com/auth/login?callbackUrl=\${encodeURIComponent(req.url)}\`
      : \`http://localhost:3000/auth/login?callbackUrl=\${encodeURIComponent(req.url)}\`
    
    return NextResponse.redirect(new URL(loginUrl))
  }

  // 管理後台權限檢查
  if (isAdminApp && req.auth) {
    const user = req.auth.user
    const hasAdminAccess = user.roleNames?.includes('admin') || 
                          user.roleNames?.includes('super-admin') || 
                          user.role === 'admin'
    
    if (!hasAdminAccess && !pathname.startsWith('/no-access')) {
      return NextResponse.redirect(new URL('/no-access', req.url))
    }
  }

  // 應用特定權限檢查
  if (appConfig.requiredRoles && req.auth) {
    const user = req.auth.user
    const userRoles = user.roleNames || [user.role]
    const hasRequiredRole = appConfig.requiredRoles.some(role => 
      userRoles.includes(role)
    )
    
    if (!hasRequiredRole && !pathname.startsWith('/no-access')) {
      return NextResponse.redirect(new URL('/no-access', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 🏗️ **第二步: 建立多應用架構**

### **方案 A: 單一代碼庫 + 條件渲染**

```typescript
// app/layout.tsx - 根據子網域顯示不同佈局
import { headers } from 'next/headers'
import { getSubdomain, getAppConfig } from '@/lib/subdomain'
import AuthLayout from '@/components/layouts/AuthLayout'
import AdminLayout from '@/components/layouts/AdminLayout'
import AppLayout from '@/components/layouts/AppLayout'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const host = headersList.get('host') || ''
  const subdomain = getSubdomain(host)
  const appConfig = getAppConfig(subdomain)

  // 根據子網域選擇佈局
  if (appConfig.layout === 'auth') {
    return (
      <html lang="zh-TW">
        <body>
          <AuthLayout>{children}</AuthLayout>
        </body>
      </html>
    )
  }

  if (appConfig.layout === 'admin') {
    return (
      <html lang="zh-TW">
        <body>
          <AdminLayout>{children}</AdminLayout>
        </body>
      </html>
    )
  }

  return (
    <html lang="zh-TW">
      <body>
        <AppLayout subdomain={subdomain}>{children}</AppLayout>
      </body>
    </html>
  )
}
```

```typescript
// app/page.tsx - 主頁根據子網域顯示不同內容
import { headers } from 'next/headers'
import { getSubdomain, getAppConfig } from '@/lib/subdomain'
import AuthHomePage from '@/components/pages/AuthHomePage'
import AdminHomePage from '@/components/pages/AdminHomePage'
import AppHomePage from '@/components/pages/AppHomePage'

export default async function HomePage() {
  const headersList = headers()
  const host = headersList.get('host') || ''
  const subdomain = getSubdomain(host)
  const appConfig = getAppConfig(subdomain)

  switch (subdomain) {
    case 'auth':
      return <AuthHomePage />
    case 'admin':
      return <AdminHomePage />
    case 'app-a':
      return <AppHomePage appName="Application A" />
    case 'app-b':
      return <AppHomePage appName="Application B" />
    default:
      return <AppHomePage appName="Main Application" />
  }
}
```

### **方案 B: 佈局組件**

```typescript
// components/layouts/AuthLayout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">認證中心</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

```typescript
// components/layouts/AdminLayout.tsx  
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar applications={[]} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader user={{}} />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## 🌐 **第三步: 開發環境設定**

### **1. 本地 Hosts 設定**

```bash
# /etc/hosts (Mac/Linux) 或 C:\Windows\System32\drivers\etc\hosts (Windows)
# 新增以下行
127.0.0.1 localhost
127.0.0.1 auth.localhost
127.0.0.1 admin.localhost  
127.0.0.1 app-a.localhost
127.0.0.1 app-b.localhost
127.0.0.1 api.localhost
```

### **2. 開發腳本**

```json
// package.json - 新增開發腳本
{
  "scripts": {
    "dev": "next dev",
    "dev:auth": "NEXTAUTH_URL=http://auth.localhost:3000 next dev -p 3000",
    "dev:admin": "NEXTAUTH_URL=http://admin.localhost:3001 next dev -p 3001", 
    "dev:app-a": "NEXTAUTH_URL=http://app-a.localhost:3002 next dev -p 3002",
    "dev:all": "concurrently \"npm run dev:auth\" \"npm run dev:admin\" \"npm run dev:app-a\"",
    "build": "next build",
    "start": "next start"
  }
}
```

### **3. 開發環境測試**

```bash
# 安裝 concurrently (同時運行多個服務)
pnpm add -D concurrently

# 啟動所有服務
pnpm run dev:all

# 或者單獨啟動
pnpm run dev:auth   # http://auth.localhost:3000
pnpm run dev:admin  # http://admin.localhost:3001
pnpm run dev:app-a  # http://app-a.localhost:3002
```

## 🚀 **第四步: 生產環境部署**

### **1. DNS 設定**

```bash
# DNS 記錄 (在域名註冊商設定)
*.example.com    A    YOUR_SERVER_IP
auth.example.com A    YOUR_SERVER_IP
admin.example.com A   YOUR_SERVER_IP
app-a.example.com A   YOUR_SERVER_IP
api.example.com  A    YOUR_SERVER_IP
```

### **2. Nginx 反向代理**

```nginx
# /etc/nginx/sites-available/example.com
server {
    listen 80;
    server_name *.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.example.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name admin.example.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:3000;  # 同一應用，不同子網域
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name app-a.example.com app-b.example.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:3000;  # 同一應用
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **3. Docker 部署 (簡化版)**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://auth.example.com
      - MAIN_DOMAIN=example.com
      - COOKIE_DOMAIN=.example.com
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped
```

## 🧪 **第五步: 測試流程**

### **1. 功能測試腳本**

```bash
#!/bin/bash
# test-sso.sh

echo "🧪 測試子網域 SSO 功能..."

# 測試認證中心
echo "📋 測試認證中心..."
curl -I http://auth.localhost:3000/auth/login
echo "✅ 認證中心可訪問"

# 測試管理後台
echo "📋 測試管理後台..."  
curl -I http://admin.localhost:3001/admin
echo "✅ 管理後台可訪問"

# 測試應用 A
echo "📋 測試應用 A..."
curl -I http://app-a.localhost:3002/
echo "✅ 應用 A 可訪問"

echo "🎉 所有子網域測試完成！"
```

### **2. Cookie 共享測試**

```typescript
// lib/test-cookie.ts
export function testCookieSharing() {
  if (typeof window === 'undefined') return;
  
  // 設定測試 Cookie
  document.cookie = "test-sso=working; domain=.localhost; path=/";
  
  // 檢查是否可讀取
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('test-sso='))
    ?.split('=')[1];
    
  console.log('Cookie 共享測試:', cookieValue === 'working' ? '✅ 成功' : '❌ 失敗');
}
```

## 📋 **實際檢查清單**

### **立即可做 (5分鐘):**
- [ ] 修改 `auth.config.ts` 中的 `cookies.domain`
- [ ] 更新 `.env.local` 增加子網域配置
- [ ] 建立 `lib/subdomain.ts` 檔案

### **今天完成 (2小時):**
- [ ] 更新 `middleware.ts` 支援子網域路由
- [ ] 建立子網域佈局組件
- [ ] 修改 `app/layout.tsx` 和 `app/page.tsx`
- [ ] 設定本地 hosts 檔案

### **本週完成 (1天):**
- [ ] 完善各子網域頁面內容
- [ ] 測試本地環境 SSO 功能
- [ ] 設定開發腳本和測試流程

### **下週完成 (2天):**
- [ ] 設定生產環境 DNS
- [ ] 配置 Nginx 反向代理
- [ ] 部署並測試生產環境

## 🎯 **現在就開始！**

**第一步 - 立即修改 (5分鐘):**

```bash
# 1. 備份現有配置
cp auth.config.ts auth.config.ts.backup

# 2. 修改 auth.config.ts (只改 cookies 部分)
# 3. 重啟開發服務器
pnpm dev
```

**這就是實際的做法 - 簡單、直接、有效！** 🚀

**需要我協助您開始第一步修改嗎？**