# System Architecture

This document describes the overall architecture of the Next.js 15 + Auth.js v5 + Centralized SSO application.

## 🏗️ High-Level Architecture

### Centralized SSO Architecture

```
                    ┌─────────────────────┐
                    │  Authentication     │
                    │     Center          │
                    │  (auth.example.com) │
                    │                     │
                    │  • OAuth Processing │
                    │  • Session Storage  │
                    │  • User Management  │
                    └──────────┬──────────┘
                               │
                    Sets Session Cookie
                    Domain: .example.com
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │  Admin   │          │Dashboard │          │ Reports  │
  │  App     │          │  App     │          │  App     │
  │(admin.example.com) │(dashboard.example.com) │(reports.example.com) │
  │                     │                     │                     │
  │ • Reads Session     │ • Reads Session     │ • Reads Session     │
  │ • Role Validation   │ • Role Validation   │ • Role Validation   │
  │ • Admin Features    │ • User Features     │ • Report Features   │
  └─────────────────────┘─────────────────────┘─────────────────────┘
```

## 🔄 Data Flow

### Authentication Flow

1. **User Access**: User visits any subdomain (e.g., `admin.example.com`)
2. **Session Check**: Application checks for valid session cookie
3. **Redirect to Auth Center**: If no valid session, redirect to `auth.example.com/login`
4. **Authentication**: User authenticates via email/password or OAuth
5. **Session Creation**: Auth center creates session with domain `.example.com`
6. **Redirect Back**: User redirected back to original subdomain
7. **Cross-Domain Access**: User can access all subdomains without re-authentication

### Session Management

```typescript
// Session cookie configuration
export const authConfig: NextAuthConfig = {
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_DOMAIN || undefined // Key for cross-domain
      }
    }
  }
};
```

## 🗄️ Database Architecture

### Core Entities

```prisma
// User Management
model User {
  id                    String                 @id @default(cuid())
  email                 String                 @unique
  name                  String?
  status                UserStatus             @default(pending)
  // ... other fields
  
  // Relationships
  accounts              Account[]
  userRoles             UserRole[]
  sessions              Session[]
}

// Role-Based Access Control
model Role {
  id          String            @id @default(cuid())
  name        String            @unique
  description String?
  
  // Relationships
  users        UserRole[]
  permissions  RolePermission[]
  applications RoleApplication[]
  menuItems    MenuItemRole[]
}

// Multi-Application Support
model Application {
  id          String             @id @default(cuid())
  name        String             @unique
  displayName String
  path        String             @unique
  isActive    Boolean            @default(true)
  
  // Relationships
  roles       RoleApplication[]
  menuItems   MenuItem[]
}

// Dynamic Menu System
model MenuItem {
  id            String          @id @default(cuid())
  name          String
  displayName   String
  path          String
  applicationId String
  
  // Relationships
  application   Application     @relation(fields: [applicationId], references: [id])
  roleAccess    MenuItemRole[]
  parent        MenuItem?       @relation("MenuItemToMenuItem")
  children      MenuItem[]      @relation("MenuItemToMenuItem")
}
```

## 🔐 Security Architecture

### Three-Layer Protection

```typescript
// 1. Middleware - Route Protection
// middleware.ts
export default withAuth(
  function middleware(req) {
    // Check authentication and permissions
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    // Role-based route protection
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!req.auth.user.roleNames.includes('admin')) {
        return NextResponse.redirect(new URL('/no-access', req.url));
      }
    }
  }
);

// 2. API Level - Permission Validation
// app/api/admin/users/route.ts
export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user.roleNames.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Proceed with admin operation
}

// 3. Server Actions - Business Logic Validation
// actions/user/index.ts
export async function updateUser(data: UserUpdateData) {
  const session = await auth();
  
  if (!session?.user.permissionNames.includes('user:update')) {
    throw new Error('Insufficient permissions');
  }
  
  // Proceed with user update
}
```

## 🎨 Frontend Architecture

### Component Hierarchy

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing page
├── auth/                   # Authentication pages
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
├── admin/                  # Admin dashboard
│   ├── layout.tsx
│   ├── page.tsx
│   ├── users/
│   │   └── page.tsx
│   └── roles/
│       └── page.tsx
└── dashboard/              # User dashboard
    ├── layout.tsx
    └── page.tsx

components/
├── ui/                     # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── form.tsx
├── auth/                   # Authentication components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── Social.tsx
└── admin/                  # Admin components
    ├── AdminLayoutClient.tsx
    ├── AdminSidebar.tsx
    └── users/
        └── UsersTable.tsx
```

### State Management

```typescript
// Session-based state management
import { useSession } from "next-auth/react";

export function UserProfile() {
  const { data: session } = useSession();
  
  return (
    <div>
      <p>Welcome, {session?.user?.name}</p>
      <p>Roles: {session?.user?.roleNames?.join(', ')}</p>
      <p>Permissions: {session?.user?.permissionNames?.join(', ')}</p>
    </div>
  );
}
```

## 🔧 Backend Architecture

### API Routes Structure

```
app/api/
├── auth/                   # Authentication endpoints
│   ├── [...nextauth]/
│   │   └── route.ts       # NextAuth.js API route
│   ├── session/
│   │   └── route.ts       # Session management
│   └── providers/
│       └── route.ts       # OAuth providers
├── admin/                  # Admin management APIs
│   ├── users/
│   │   ├── route.ts       # User management
│   │   └── [userId]/
│   │       └── route.ts   # Single user operations
│   ├── roles/
│   │   └── route.ts       # Role management
│   └── applications/
│       └── route.ts       # Application management
└── menu/
    └── route.ts           # Dynamic menu system
```

### Server Actions

```typescript
// actions/auth/index.ts
export async function login(credentials: LoginCredentials) {
  // Server-side authentication
  const result = await signIn('credentials', {
    ...credentials,
    redirect: false
  });
  
  return result;
}

// actions/user/index.ts
export async function updateProfile(data: ProfileData) {
  // Server-side validation and update
  const session = await auth();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  return await db.user.update({
    where: { id: session.user.id },
    data
  });
}
```

## 🌐 Cross-Domain Communication

### CORS Configuration

```typescript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.ALLOWED_ORIGINS || "*"
          }
        ]
      }
    ];
  }
};
```

### Safe Redirects

```typescript
// auth.config.ts
export const authConfig: NextAuthConfig = {
  callbacks: {
    async redirect({ url, baseUrl }) {
      const allowedDomains = process.env.ALLOWED_DOMAINS
        ? process.env.ALLOWED_DOMAINS.split(",").map(d => d.trim())
        : [new URL(baseUrl).hostname];
      
      // Validate redirect URL against allowed domains
      const urlObj = new URL(url, baseUrl);
      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname === domain || 
        urlObj.hostname.endsWith(`.${domain}`)
      );
      
      return isAllowed ? urlObj.toString() : baseUrl;
    }
  }
};
```

## 📊 Performance Considerations

### Database Optimization

- **Indexed Queries**: All foreign keys and frequently queried fields are indexed
- **Connection Pooling**: Prisma client with connection pooling
- **Selective Loading**: Only load necessary fields in queries

### Frontend Optimization

- **Static Generation**: Where applicable for public pages
- **Dynamic Imports**: Code splitting for large components
- **Image Optimization**: Next.js Image component with CDN support

### Session Optimization

- **JWT Strategy**: Stateless JWT tokens for API calls
- **Database Sessions**: Persistent sessions for cross-domain SSO
- **Token Refresh**: Automatic session refresh mechanisms

## 🔄 Deployment Architecture

### Production Environment

```
Load Balancer
    │
    ├── Vercel/Next.js App (auth.example.com)
    ├── Vercel/Next.js App (admin.example.com)  
    ├── Vercel/Next.js App (dashboard.example.com)
    │
    └── PostgreSQL Database
        ├── Connection Pool
        ├── Read Replicas (optional)
        └── Backup Strategy
```

### Environment Configuration

```env
# Production Environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/prod_db
AUTH_SECRET=your-32-character-super-secret-key
COOKIE_DOMAIN=.example.com
ALLOWED_DOMAINS=auth.example.com,admin.example.com,dashboard.example.com
AUTH_URL=https://auth.example.com
```

---

**Next**: [Database Schema](./database-schema.md) → Detailed database design and relationships