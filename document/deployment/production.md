# Production Deployment

Complete guide for deploying the Next.js 15 + Auth.js v5 application to production environments.

## 🚀 Deployment Options

### Vercel (Recommended)

Vercel provides the best experience for Next.js applications with automatic deployments, preview environments, and edge network.

#### Setup Steps

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Or connect GitHub repository for automatic deployments
```

#### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

#### Environment Variables on Vercel

```env
# Required
DATABASE_URL="postgresql://user:pass@host:5432/db"
AUTH_SECRET="your-32-character-super-secret-key"
AUTH_URL="https://your-domain.com"
COOKIE_DOMAIN=".your-domain.com"
ALLOWED_DOMAINS="auth.your-domain.com,admin.your-domain.com"

# Optional OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### AWS (EC2 + RDS)

#### Infrastructure Setup

```bash
# Create EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx

# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier your-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password secure-password \
  --allocated-storage 20
```

#### Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build

# Run database migrations
npx prisma migrate deploy

# Restart application
pm2 restart your-app-name || pm2 start npm --name "your-app-name" -- start
```

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'your-app',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - AUTH_URL=${AUTH_URL}
      - COOKIE_DOMAIN=${COOKIE_DOMAIN}
      - ALLOWED_DOMAINS=${ALLOWED_DOMAINS}
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
```

## 🔧 Production Configuration

### Environment Variables

```env
# Production Environment
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Authentication
AUTH_SECRET="production-32-character-super-secure-secret-key"
AUTH_URL="https://auth.your-domain.com"

# Cross-Domain
COOKIE_DOMAIN=".your-domain.com"
ALLOWED_DOMAINS="auth.your-domain.com,admin.your-domain.com,dashboard.your-domain.com"

# Security
NEXTAUTH_DEBUG=false

# Performance
NEXT_TELEMETRY_DISABLED=1
```

### Security Headers

```javascript
// next.config.mjs - Security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### Database Optimization

#### Connection Pooling

```env
# Database connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_IDLE_TIMEOUT=30000
```

#### Prisma Configuration

```typescript
// lib/db.ts - Production configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export { prisma as db };
```

## 📊 Monitoring & Observability

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 503 }
    );
  }
}
```

### Error Tracking

#### Sentry Integration

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export { Sentry };
```

#### Error Boundary

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to your error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
```

### Performance Monitoring

#### Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Custom Metrics

```typescript
// lib/metrics.ts
export function trackApiPerformance(endpoint: string, duration: number) {
  // Send to your monitoring service
  console.log(`API Performance: ${endpoint} - ${duration}ms`);
}

export function trackDatabaseQuery(query: string, duration: number) {
  // Send to your monitoring service
  console.log(`DB Query: ${query} - ${duration}ms`);
}
```

## 🔒 Security Configuration

### Rate Limiting

```typescript
// lib/rateLimiter.ts
import { rateLimit } from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### CORS Configuration

```javascript
// next.config.mjs - CORS settings
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_DOMAINS?.split(',').join(', ') || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run lint
      
      - run: npm run typecheck
      
      - run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          AUTH_SECRET: test-secret
          AUTH_URL: http://localhost:3000
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@v28
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Database Migrations

```yaml
# .github/workflows/migrate.yml
name: Database Migrations

on:
  workflow_dispatch:
  push:
    branches: [ main ]

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 📈 Performance Optimization

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

export function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={300}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### Static Generation

```typescript
// Use static generation for public pages
export async function generateStaticParams() {
  return [
    { slug: 'about' },
    { slug: 'contact' },
    { slug: 'privacy' }
  ];
}
```

### Caching Strategy

```typescript
// Use unstable_cache for data caching
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async (key: string) => {
    // Your data fetching logic
    return data;
  },
  ['data-key'],
  { revalidate: 3600 } // 1 hour
);
```

## 🐛 Troubleshooting

### Common Production Issues

#### Database Connection

```bash
# Check database connection
npx prisma db execute --file check-connection.sql

# Check connection pool
SELECT * FROM pg_stat_activity;
```

#### Memory Issues

```bash
# Check memory usage
pm2 monit

# Or with Node.js
node -e "console.log(process.memoryUsage())"
```

#### Performance Issues

```bash
# Generate performance report
npm run build -- --profile

# Analyze bundle size
npm run analyze
```

### Logging

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export { logger };
```

---

**Next**: [Testing Strategy](../testing/strategy.md) → Comprehensive testing approach and implementation