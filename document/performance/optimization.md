# Performance Optimization

Comprehensive performance optimization guide for the Next.js 15 + Auth.js v5 application.

## 🚀 Performance Overview

### Key Performance Metrics

```typescript
// lib/metrics/performance.ts
export interface PerformanceMetrics {
  // Core Web Vitals
  largestContentfulPaint: number; // LCP: Should be < 2.5s
  firstContentfulPaint: number;   // FCP: Should be < 1.8s
  cumulativeLayoutShift: number;  // CLS: Should be < 0.1
  firstInputDelay: number;        // FID: Should be < 100ms
  
  // Application Metrics
  timeToInteractive: number;
  serverResponseTime: number;
  databaseQueryTime: number;
  bundleSize: number;
}

export const DEFAULT_PERFORMANCE_TARGETS: PerformanceMetrics = {
  largestContentfulPaint: 2500,
  firstContentfulPaint: 1800,
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100,
  timeToInteractive: 3000,
  serverResponseTime: 200,
  databaseQueryTime: 100,
  bundleSize: 500000, // 500KB
};
```

### Performance Monitoring Setup

```typescript
// app/layout.tsx - Performance monitoring
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## 📦 Bundle Optimization

### Code Splitting

```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Disable SSR for client-only components
});

const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  loading: () => <div>Loading admin panel...</div>,
});

// Use in components
export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
      <AdminPanel />
    </div>
  );
}
```

### Tree Shaking

```typescript
// Import only what you need
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Avoid wildcard imports
// ❌ Don't do this
// import * as UI from '@/components/ui';

// ✅ Do this instead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

### Bundle Analysis

```json
// package.json - Bundle analysis scripts
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "analyze:server": "bundlesize"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^13.0.0"
  }
}
```

```javascript
// next.config.mjs - Bundle analyzer
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // ... other config
};

export default bundleAnalyzer(nextConfig);
```

## 🗄️ Database Performance

### Query Optimization

```typescript
// lib/db/optimization.ts
export class QueryOptimizer {
  // Use select to fetch only needed fields
  static async getUsersList() {
    return await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        // Avoid fetching unnecessary fields
        // password: false,
        // userRoles: false,
      },
      where: {
        status: 'active',
        // Use indexed fields in where clauses
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        // Use indexed fields for ordering
        createdAt: 'desc',
      },
      take: 50, // Limit results
    });
  }

  // Batch operations
  static async batchUpdateUserStatus(userIds: string[], status: string) {
    return await db.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        status,
      },
    });
  }

  // Use transactions for multiple operations
  static async createUserWithRole(userData: any, roleId: string) {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId,
        },
      });

      return user;
    });
  }
}
```

### Index Optimization

```prisma
// prisma/schema.prisma - Performance indexes
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  status    UserStatus
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([email, status]) // Composite index
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  lastActivity DateTime @default(now())

  @@index([userId])
  @@index([expires]) // For cleanup queries
  @@index([lastActivity]) // For activity tracking
}
```

### Connection Pooling

```typescript
// lib/db.ts - Connection pool configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  ...(process.env.NODE_ENV === 'production' && {
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=30',
      },
    },
  }),
});

export { prisma as db };
```

## 🖼️ Image Optimization

### Next.js Image Component

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width = 500,
  height = 300,
  className,
  priority = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

### Responsive Images

```typescript
// components/ResponsiveImage.tsx
import Image from 'next/image';

export function ResponsiveImage({
  src,
  alt,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: {
  src: string;
  alt: string;
  sizes?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      style={{
        objectFit: 'cover',
      }}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

## 🔄 Caching Strategies

### Data Caching

```typescript
// lib/cache/dataCache.ts
import { unstable_cache } from 'next/cache';

export const getCachedUsers = unstable_cache(
  async (page: number = 1, limit: number = 20) => {
    return await db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['users'], // cache key
  { revalidate: 60 } // revalidate every 60 seconds
);

export const getCachedMenuItems = unstable_cache(
  async (applicationId: string) => {
    return await db.menuItem.findMany({
      where: {
        applicationId,
        isVisible: true,
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
      ],
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
    });
  },
  ['menu-items'],
  { revalidate: 300 } // revalidate every 5 minutes
);
```

### API Response Caching

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Set cache headers
  const response = NextResponse.json({
    users: await getCachedUsers(page, limit),
    pagination: { page, limit },
  });

  // Cache for 1 minute
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  
  return response;
}
```

### Static Generation

```typescript
// app/static-page/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Static Page',
  description: 'This page is statically generated for optimal performance',
};

// Generate static page at build time
export default function StaticPage() {
  return (
    <div>
      <h1>Statically Generated Page</h1>
      <p>This page loads instantly because it's pre-rendered at build time.</p>
    </div>
  );
}

// Force static generation
export const dynamic = 'force-static';
```

## ⚡ Rendering Optimization

### Server-Side Rendering (SSR)

```typescript
// app/dashboard/page.tsx
import { auth } from '@/auth';

export default async function Dashboard() {
  // Server-side data fetching
  const session = await auth();
  const userData = await db.user.findUnique({
    where: { id: session?.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div>
      <h1>Welcome, {userData?.name}</h1>
      {/* Render server-fetched data */}
    </div>
  );
}
```

### Client-Side Rendering (CSR)

```typescript
// components/ClientSideData.tsx
'use client';

import { useState, useEffect } from 'react';

export function ClientSideData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/user-data');
        const userData = await response.json();
        setData(userData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div>{/* Render client-fetched data */}</div>;
}
```

### React Optimization

```typescript
// components/OptimizedList.tsx
'use client';

import { memo, useMemo, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface OptimizedListProps {
  users: User[];
  onUserClick: (user: User) => void;
}

// Memoize component to prevent unnecessary re-renders
const OptimizedList = memo(function OptimizedList({
  users,
  onUserClick,
}: OptimizedListProps) {
  // Memoize expensive computations
  const activeUsers = useMemo(() => {
    return users.filter(user => user.status === 'active');
  }, [users]);

  // Memoize callbacks
  const handleUserClick = useCallback((user: User) => {
    onUserClick(user);
  }, [onUserClick]);

  return (
    <div>
      {activeUsers.map(user => (
        <UserItem
          key={user.id}
          user={user}
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
});

// Memoize individual list items
const UserItem = memo(function UserItem({
  user,
  onClick,
}: {
  user: User;
  onClick: (user: User) => void;
}) {
  return (
    <div onClick={() => onClick(user)}>
      {user.name} - {user.email}
    </div>
  );
});

export default OptimizedList;
```

## 🌐 Network Optimization

### HTTP/2 and Compression

```javascript
// next.config.mjs - Compression and HTTP/2
import compression from 'next-compression';

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false, // Let CDN handle etags
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default compression(nextConfig);
```

### CDN Configuration

```typescript
// lib/cdn.ts
export const CDN_CONFIG = {
  imageOptimization: {
    quality: 80,
    format: 'webp',
    width: 1200,
  },
  staticAssets: {
    cacheDuration: 31536000, // 1 year
    immutable: true,
  },
};

export function getOptimizedImageUrl(src: string, width?: number, height?: number) {
  const params = new URLSearchParams({
    format: 'webp',
    quality: '80',
  });
  
  if (width) params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  
  return `${process.env.CDN_BASE_URL}/${src}?${params.toString()}`;
}
```

## 📊 Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// lib/performance/monitoring.ts
export class PerformanceMonitor {
  static trackPageView(page: string, duration: number) {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: page,
        page_location: window.location.href,
        page_duration: duration,
      });
    }
  }

  static trackApiCall(endpoint: string, duration: number, status: number) {
    console.log(`API Performance: ${endpoint} - ${duration}ms - ${status}`);
    
    // Send to monitoring service
    // yourMonitoringService.trackApiPerformance(endpoint, duration, status);
  }

  static trackDatabaseQuery(query: string, duration: number) {
    console.log(`DB Query: ${query} - ${duration}ms`);
    
    // Alert on slow queries
    if (duration > 1000) {
      console.warn(`Slow database query detected: ${query} took ${duration}ms`);
    }
  }
}
```

### Performance Budget

```typescript
// performance-budget.json
{
  "budget": {
    "performance": {
      "firstContentfulPaint": "1.8s",
      "largestContentfulPaint": "2.5s",
      "cumulativeLayoutShift": "0.1",
      "firstInputDelay": "100ms",
      "timeToInteractive": "3s"
    },
    "resourceSizes": {
      "javascript": "300KB",
      "css": "50KB",
      "images": "500KB",
      "fonts": "100KB",
      "total": "1MB"
    },
    "resourceCounts": {
      "javascript": 10,
      "css": 3,
      "images": 20,
      "fonts": 3,
      "total": 50
    }
  }
}
```

## 🔧 Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { test, expect } from '@playwright/test';

test.describe('Load Testing', () => {
  test('should handle concurrent users', async ({ page }) => {
    // Simulate multiple concurrent users
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const userPage = await page.context().newPage();
      await userPage.goto('/');
      await userPage.waitForLoadState('networkidle');
      return userPage;
    });

    const pages = await Promise.all(promises);
    
    // Verify all pages loaded successfully
    for (const userPage of pages) {
      await expect(userPage.locator('body')).toBeVisible();
      await userPage.close();
    }
  });

  test('should maintain performance under load', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Assert performance target
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });
});
```

### Performance Profiling

```bash
# Generate performance profile
npm run build -- --profile

# Analyze bundle size
npm run analyze

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# WebPageTest
npx webpagetest test http://localhost:3000 --key YOUR_API_KEY
```

## 🛠️ Performance Tools

### Development Tools

```json
// package.json - Performance tools
{
  "devDependencies": {
    "webpack-bundle-analyzer": "^4.9.0",
    "lighthouse": "^10.0.0",
    "@speedcurve/core": "^1.0.0",
    "bundlesize": "^0.18.0"
  }
}
```

### Monitoring Services

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **Datadog**: Application performance monitoring
- **New Relic**: Full-stack observability

---

**Next**: [UI/UX Components](../ui-ux/components.md) → Component library and design system documentation