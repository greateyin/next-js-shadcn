# Authentication System

Complete documentation of the Auth.js v5 authentication system implementation with cross-domain SSO support.

## 🔐 Overview

The authentication system uses Auth.js v5 (NextAuth) with:

- **Multiple Providers**: Email/Password, Google OAuth, GitHub OAuth
- **Cross-Domain SSO**: Single sign-on across multiple subdomains
- **Database Sessions**: Persistent session management
- **Two-Factor Authentication**: Optional 2FA support
- **Security Features**: Rate limiting, audit logging, secure cookies

## ⚙️ Configuration

### Core Configuration

```typescript
// auth.config.ts
export const authConfig: NextAuthConfig = {
  debug: false, // Disable debug mode for production
  adapter: PrismaAdapter(db) as any,
  providers: [
    // OAuth providers
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    
    // Email/Password provider
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authentication logic
      }
    })
  ],
  callbacks: {
    // Callback implementations
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
    // Cross-domain cookie configuration
  },
  trustHost: true, // Required for Next.js 15+ App Router
};
```

### Cross-Domain Cookie Configuration

```typescript
cookies: {
  sessionToken: {
    // Use __Secure- prefix for enhanced security (production environment)
    name: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
    options: {
      httpOnly: true,      // Prevent XSS attacks
      sameSite: "lax" as const, // Prevent CSRF attacks
      path: "/",
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      // 👇 Key: Share cookies across subdomains
      domain: process.env.COOKIE_DOMAIN || undefined
    }
  }
}
```

## 🔄 Authentication Flow

### Email/Password Flow

```typescript
// Credentials provider authorize function
async authorize(credentials) {
  try {
    // Parse and validate credentials
    const validatedFields = LoginSchema.safeParse(credentials);
    if (!validatedFields.success) {
      return null;
    }

    const { email, password } = validatedFields.data;
    
    // Find user
    const user = await db.user.findUnique({
      where: { email }
    });
    
    // Check if user exists
    if (!user) {
      return null;
    }
    
    // Verify password
    const isValid = user.password 
      ? await verifyPassword(password, user.password)
      : false;
    
    if (!isValid) {
      return null;
    }
    
    // Return safe user object
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      emailVerified: user.emailVerified ?? null,
      image: user.image ?? null,
      role: 'user', // Default role
      status: mapStatus(user.status),
      password: null, // Don't pass the password back
      isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
    };
  } catch (error) {
    console.error("Authorization error:", error);
    return null;
  }
}
```

### OAuth Flow

```typescript
// OAuth signIn callback
async signIn({ user, account, profile }) {
  // For OAuth providers, ensure user has active status and default role
  if (account?.provider !== "credentials") {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        include: { userRoles: true }
      });

      // If user was just created via OAuth (no roles assigned)
      if (existingUser && existingUser.userRoles.length === 0) {
        // Set user status to active (OAuth emails are pre-verified)
        await db.user.update({
          where: { id: existingUser.id },
          data: { 
            status: "active",
            emailVerified: new Date() // OAuth emails are verified
          }
        });

        // Assign default "user" role
        const userRole = await db.role.findUnique({
          where: { name: "user" }
        });

        if (userRole) {
          await db.userRole.create({
            data: {
              userId: existingUser.id,
              roleId: userRole.id
            }
          });
        }
      }
    } catch (error) {
      console.error("Error in OAuth signIn callback:", error);
      // Continue with sign in even if role assignment fails
    }
  }
  
  return true;
}
```

## 🔑 JWT and Session Management

### JWT Callback

```typescript
async jwt({ token, user, account }) {
  if (user) {
    token.id = user.id;
    token.status = user.status;
    token.email = user.email;
    token.name = user.name ?? null;
    token.picture = user.image ?? null;
    
    try {
      // Get user roles and permissions
      const userRolesAndPermissions = await getUserRolesAndPermissions(user.id);
      
      // Simplify token data to reduce size
      token.roleNames = userRolesAndPermissions.roles.map(r => r.name);
      token.permissionNames = userRolesAndPermissions.permissions.map(p => p.name);
      token.applicationPaths = userRolesAndPermissions.applications.map(a => a.path);
      
      // For backward compatibility
      token.role = userRolesAndPermissions.roles.some(r => r.name === 'admin') 
        ? 'admin' 
        : 'user';
        
    } catch (error) {
      console.error("Error getting user roles:", error);
      token.roleNames = [];
      token.permissionNames = [];
      token.applicationPaths = [];
      token.role = 'user'; // Default to user role
    }
  }
  return token;
}
```

### Session Callback

```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id as string;
    session.user.status = token.status as UserStatus;
    session.user.email = token.email as string;
    session.user.name = token.name ?? null;
    session.user.image = token.picture ?? null;
    
    // For backward compatibility
    session.user.role = token.role as string;
    
    // Add simplified role data to session
    session.user.roleNames = (token.roleNames as string[]) || [];
    session.user.permissionNames = (token.permissionNames as string[]) || [];
    session.user.applicationPaths = (token.applicationPaths as string[]) || [];
    
    // For compatibility with existing code
    session.user.roles = session.user.roleNames.map(name => ({ name, id: '', createdAt: new Date(), updatedAt: new Date() }));
    session.user.permissions = session.user.permissionNames.map(name => ({ name, id: '', createdAt: new Date(), updatedAt: new Date(), description: undefined }));
    session.user.applications = session.user.applicationPaths.map(path => ({ 
      path, 
      id: '', 
      name: '', 
      displayName: '', 
      isActive: true, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      description: undefined,
      icon: undefined,
      order: 0
    }));
    
  }
  return session;
}
```

## 🌐 Cross-Domain SSO

### Safe Redirects

```typescript
async redirect({ url, baseUrl }) {
  // List of allowed subdomains (read from environment variable, defaults to current domain only)
  const allowedDomains = process.env.ALLOWED_DOMAINS
    ? process.env.ALLOWED_DOMAINS.split(",").map(d => d.trim())
    : [new URL(baseUrl).hostname];
  
  try {
    const urlObj = new URL(url, baseUrl);
    const baseUrlObj = new URL(baseUrl);
    
    // Check if domain is allowed
    const isAllowedDomain = allowedDomains.some(domain => {
      // Exact match or subdomain match
      return urlObj.hostname === domain || 
             urlObj.hostname.endsWith(`.${domain}`);
    });
    
    // Check if same parent domain
    const isSameParentDomain = process.env.COOKIE_DOMAIN && 
      urlObj.hostname.endsWith(process.env.COOKIE_DOMAIN);
    
    if (isAllowedDomain || isSameParentDomain) {
      return urlObj.toString();
    }
    
    // If no match, return baseUrl
    console.warn(`Redirect blocked: ${url} is not in allowed domains`);
    return baseUrl;
  } catch (error) {
    console.error("Redirect error:", error);
    return baseUrl;
  }
}
```

### Subdomain Authentication Helper

```typescript
// lib/auth/subdomain-auth.ts
export function getSubdomainAuthConfig(subdomain: string) {
  return {
    ...authConfig,
    cookies: {
      sessionToken: {
        ...authConfig.cookies?.sessionToken,
        options: {
          ...authConfig.cookies?.sessionToken?.options,
          domain: process.env.COOKIE_DOMAIN
        }
      }
    }
  };
}
```

## 🔒 Security Features

### Password Security

```typescript
// lib/crypto.ts
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

### Rate Limiting

```typescript
// lib/rateLimiter.ts
export const loginRateLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});
```

### Audit Logging

```typescript
// lib/audit/auditLogger.ts
export async function logAuthEvent(
  userId: string,
  action: string,
  status: string,
  metadata?: any
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      status,
      timestamp: new Date(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata
    }
  });
}
```

## 🎯 Usage Examples

### Server-Side Authentication

```typescript
// Get current session
import { auth } from '@/auth';

export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  return session.user;
}

// Check if user is admin
export async function isUserAdmin() {
  const session = await auth();
  return session?.user.roleNames?.includes('admin') ?? false;
}

// Check specific permission
export async function hasPermission(permission: string) {
  const session = await auth();
  return session?.user.permissionNames?.includes(permission) ?? false;
}
```

### Client-Side Authentication

```typescript
// components/auth/UserButton.tsx
'use client';

import { useSession } from 'next-auth/react';

export function UserButton() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <div>Not signed in</div>;
  }
  
  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <p>Roles: {session.user.roleNames?.join(', ')}</p>
    </div>
  );
}
```

### Protected Routes

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Check authentication
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    // Role-based protection
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!req.auth.user.roleNames?.includes('admin')) {
        return NextResponse.redirect(new URL('/no-access', req.url));
      }
    }
    
    // Application-based protection
    if (req.nextUrl.pathname.startsWith('/app/')) {
      const appPath = req.nextUrl.pathname.split('/')[2];
      if (!req.auth.user.applicationPaths?.includes(appPath)) {
        return NextResponse.redirect(new URL('/no-access', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ auth }) => !!auth
    }
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/app/:path*',
    '/dashboard/:path*'
  ]
};
```

## 🛠️ API Endpoints

### Authentication API

```typescript
// app/api/auth/session/route.ts
export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles: session.user.roleNames,
      permissions: session.user.permissionNames
    }
  });
}
```

### Logout Endpoint

```typescript
// app/api/auth/logout/route.ts
export async function POST() {
  const session = await auth();
  
  if (session) {
    // Invalidate session in database
    await db.session.deleteMany({
      where: { userId: session.user.id }
    });
    
    // Log audit event
    await logAuthEvent(session.user.id, 'LOGOUT', 'SUCCESS');
  }
  
  // Sign out with NextAuth
  await signOut({ redirect: false });
  
  return NextResponse.json({ success: true });
}
```

## 🔧 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"

# Authentication
AUTH_SECRET="your-32-character-super-secret-key"

# Cross-domain SSO
COOKIE_DOMAIN=.example.com
ALLOWED_DOMAINS=auth.example.com,admin.example.com,dashboard.example.com
AUTH_URL=https://auth.example.com

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## 🐛 Troubleshooting

### Common Issues

**Session Not Persisting Across Subdomains**
- Verify `COOKIE_DOMAIN` starts with `.` (e.g., `.example.com`)
- Check browser isn't blocking third-party cookies
- Ensure all subdomains use same protocol (http/https)

**OAuth Redirect Errors**
- Verify OAuth callback URLs are correctly configured
- Check `ALLOWED_DOMAINS` includes all subdomains
- Ensure `AUTH_URL` is correctly set

**Permission Issues**
- Check user roles and permissions in database
- Verify JWT callback is correctly populating role data
- Check middleware configuration

---

**Next**: [Permission System](./permissions.md) → Role-based access control implementation