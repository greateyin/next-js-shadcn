# Security Best Practices

Comprehensive security guidelines and implementation for the Next.js 15 + Auth.js v5 application.

## 🔐 Authentication Security

### Password Security

```typescript
// lib/auth/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Industry standard
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*()_+-\=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Session Security

```typescript
// auth.config.ts - Secure session configuration
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.permissionNames = await getUserPermissions(user.id);
        token.roleNames = await getUserRoles(user.id);
      }
      
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      
      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.userId as string;
      session.user.permissionNames = token.permissionNames as string[];
      session.user.roleNames = token.roleNames as string[];
      
      return session;
    },
  },
};
```

### Rate Limiting

```typescript
// lib/security/rateLimiter.ts
import { RateLimiter } from 'limiter';

export class SecurityRateLimiter {
  private static limiters = new Map<string, RateLimiter>();
  
  static getLimiter(key: string, requestsPerMinute: number): RateLimiter {
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter({
        tokensPerInterval: requestsPerMinute,
        interval: 'minute'
      }));
    }
    return this.limiters.get(key)!;
  }
  
  static async checkLimit(key: string, requestsPerMinute: number): Promise<boolean> {
    const limiter = this.getLimiter(key, requestsPerMinute);
    return await limiter.tryRemoveTokens(1);
  }
}

// Specific rate limiters
export const loginRateLimiter = {
  check: async (ip: string) => {
    return await SecurityRateLimiter.checkLimit(`login:${ip}`, 5); // 5 attempts per minute
  }
};

export const apiRateLimiter = {
  check: async (ip: string) => {
    return await SecurityRateLimiter.checkLimit(`api:${ip}`, 100); // 100 requests per minute
  }
};

export const passwordResetRateLimiter = {
  check: async (email: string) => {
    return await SecurityRateLimiter.checkLimit(`password-reset:${email}`, 3); // 3 attempts per hour
  }
};
```

## 🛡️ Input Validation

### Schema Validation

```typescript
// schemas/security.ts
import { z } from 'zod';

export const EmailSchema = z.string().email('Invalid email address');

export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

export const NameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

export const URLSchema = z.string().url('Invalid URL');

export const IDSchema = z.string().cuid('Invalid ID format');

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  }
  
  return sanitized;
};
```

### SQL Injection Prevention

```typescript
// lib/db/security.ts
import { db } from './db';

export class DatabaseSecurity {
  static async safeQuery<T>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    // Use parameterized queries - Prisma handles this automatically
    return await db.$queryRawUnsafe<T>(query, ...params);
  }
  
  static validateTableName(table: string): boolean {
    const validTables = ['user', 'role', 'permission', 'application', 'menu_item'];
    return validTables.includes(table.toLowerCase());
  }
  
  static validateColumnName(column: string): boolean {
    const validColumns = ['id', 'email', 'name', 'created_at', 'updated_at'];
    return validColumns.includes(column.toLowerCase());
  }
}
```

## 🌐 Cross-Domain Security

### CORS Configuration

```javascript
// next.config.mjs - Security headers and CORS
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
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim()
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
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
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Cross-Domain Cookie Security

```typescript
// lib/security/cookies.ts
export function setSecureCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    domain?: string;
    path?: string;
  } = {}
): string {
  const { maxAge = 30 * 24 * 60 * 60, domain, path = '/' } = options;
  
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = 'lax';
  
  return `${name}=${value}; HttpOnly; Max-Age=${maxAge}; Path=${path}; ${
    secure ? 'Secure; ' : ''
  }SameSite=${sameSite}; ${domain ? `Domain=${domain};` : ''}`;
}

export function validateCookieDomain(domain: string): boolean {
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
  return allowedDomains.some(allowed => domain.endsWith(allowed));
}
```

## 🔒 Authorization Security

### Permission-Based Access Control

```typescript
// lib/security/authorization.ts
import { auth } from '@/auth';

export class AuthorizationService {
  static async requirePermission(permission: string) {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    const hasPermission = session.user.permissionNames?.includes(permission);
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }
    
    return session;
  }
  
  static async requireAnyPermission(permissions: string[]) {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    const hasAnyPermission = permissions.some(permission => 
      session.user.permissionNames?.includes(permission)
    );
    
    if (!hasAnyPermission) {
      throw new Error('Insufficient permissions');
    }
    
    return session;
  }
  
  static async requireAllPermissions(permissions: string[]) {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    const hasAllPermissions = permissions.every(permission => 
      session.user.permissionNames?.includes(permission)
    );
    
    if (!hasAllPermissions) {
      throw new Error('Insufficient permissions');
    }
    
    return session;
  }
  
  static async requireRole(role: string) {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    const hasRole = session.user.roleNames?.includes(role);
    
    if (!hasRole) {
      throw new Error('Insufficient role');
    }
    
    return session;
  }
}
```

### Resource-Level Authorization

```typescript
// lib/security/resourceAuthorization.ts
export class ResourceAuthorization {
  static async canAccessUser(resourceUserId: string, currentUserId: string): Promise<boolean> {
    // Users can access their own data
    if (resourceUserId === currentUserId) {
      return true;
    }
    
    // Check if current user has permission to access other users
    const session = await auth();
    return session?.user.permissionNames?.includes('user:read') ?? false;
  }
  
  static async canModifyUser(resourceUserId: string, currentUserId: string): Promise<boolean> {
    // Users can modify their own data
    if (resourceUserId === currentUserId) {
      return true;
    }
    
    // Check if current user has permission to modify other users
    const session = await auth();
    return session?.user.permissionNames?.includes('user:update') ?? false;
  }
  
  static async canDeleteUser(resourceUserId: string, currentUserId: string): Promise<boolean> {
    // Users cannot delete themselves
    if (resourceUserId === currentUserId) {
      return false;
    }
    
    // Check if current user has permission to delete users
    const session = await auth();
    return session?.user.permissionNames?.includes('user:delete') ?? false;
  }
}
```

## 📝 Audit Logging

### Security Event Logging

```typescript
// lib/security/auditLogger.ts
import { db } from '@/lib/db';

export enum AuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  ACCESS_DENIED = 'ACCESS_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

export enum AuditPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class AuditLogger {
  static async logSecurityEvent(
    action: AuditAction,
    userId: string | null,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      resourceId?: string;
      resourceType?: string;
      details?: any;
      priority?: AuditPriority;
    } = {}
  ) {
    try {
      await db.auditLog.create({
        data: {
          userId,
          action,
          status: action.includes('FAILED') || action === 'ACCESS_DENIED' ? 'FAILED' : 'SUCCESS',
          timestamp: new Date(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          resourceId: metadata.resourceId,
          resourceType: metadata.resourceType,
          metadata: metadata.details ? JSON.stringify(metadata.details) : null,
          priority: metadata.priority || AuditPriority.MEDIUM,
        },
      });
    } catch (error) {
      // Don't let audit logging failures break the application
      console.error('Failed to log audit event:', error);
    }
  }
  
  static async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string
  ) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    await this.logSecurityEvent(
      success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
      user?.id || null,
      {
        ipAddress,
        userAgent,
        details: { email, success },
        priority: success ? AuditPriority.LOW : AuditPriority.HIGH
      }
    );
  }
  
  static async logSuspiciousActivity(
    userId: string | null,
    activity: string,
    metadata: any
  ) {
    await this.logSecurityEvent(
      AuditAction.SUSPICIOUS_ACTIVITY,
      userId,
      {
        details: { activity, ...metadata },
        priority: AuditPriority.CRITICAL
      }
    );
  }
}
```

## 🔍 Security Monitoring

### Suspicious Activity Detection

```typescript
// lib/security/monitoring.ts
export class SecurityMonitor {
  static async detectSuspiciousLogin(userId: string, ipAddress: string, userAgent: string) {
    // Check for multiple failed login attempts
    const recentFailedLogins = await db.auditLog.count({
      where: {
        userId,
        action: AuditAction.LOGIN_FAILED,
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });
    
    if (recentFailedLogins >= 5) {
      await AuditLogger.logSuspiciousActivity(
        userId,
        'Multiple failed login attempts',
        { failedAttempts: recentFailedLogins, ipAddress }
      );
      
      // Optionally lock the account temporarily
      await this.temporarilyLockAccount(userId);
    }
    
    // Check for login from new location/device
    const previousLogins = await db.auditLog.findMany({
      where: {
        userId,
        action: AuditAction.LOGIN_SUCCESS,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        ipAddress: true,
        userAgent: true
      },
      distinct: ['ipAddress']
    });
    
    const isNewLocation = !previousLogins.some(login => 
      login.ipAddress === ipAddress
    );
    
    if (isNewLocation) {
      await AuditLogger.logSuspiciousActivity(
        userId,
        'Login from new location',
        { ipAddress, userAgent, previousLocations: previousLogins.map(l => l.ipAddress) }
      );
      
      // Optionally require additional verification
      await this.requireAdditionalVerification(userId);
    }
  }
  
  private static async temporarilyLockAccount(userId: string) {
    await db.user.update({
      where: { id: userId },
      data: {
        status: 'suspended',
        loginAttempts: 0,
        lastLoginAttempt: new Date()
      }
    });
    
    // Schedule account unlock after 30 minutes
    setTimeout(async () => {
      await db.user.update({
        where: { id: userId },
        data: {
          status: 'active'
        }
      });
    }, 30 * 60 * 1000);
  }
  
  private static async requireAdditionalVerification(userId: string) {
    // Implement 2FA or email verification requirement
    // This is a placeholder for the actual implementation
    console.log(`Additional verification required for user ${userId}`);
  }
}
```

## 🔧 Security Headers Middleware

### Custom Security Middleware

```typescript
// middleware/security.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add CSP header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    );
  }
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || 'unknown';
    // Implement rate limiting logic here
  }
  
  return response;
}
```

## 🧪 Security Testing

### Security Test Suite

```typescript
// __tests__/security/authentication.test.ts
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

describe('Password Security', () => {
  describe('hashPassword', () => {
    it('hashes password correctly', async () => {
      const password = 'SecurePassword123!';
      const hashed = await hashPassword(password);
      
      expect(hashed).not.toBe(password);
      expect(hashed).toHaveLength(60); // bcrypt hash length
    });
    
    it('produces different hashes for same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('verifyPassword', () => {
    it('verifies correct password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });
    
    it('rejects incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });
  
  describe('validatePasswordStrength', () => {
    it('accepts strong passwords', () => {
      const strongPassword = 'StrongPass123!';
      const result = validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('rejects weak passwords', () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecial123'
      ];
      
      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });
});

// __tests__/security/authorization.test.ts
import { AuthorizationService } from '@/lib/security/authorization';

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

describe('Authorization Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('requirePermission', () => {
    it('allows access with correct permission', async () => {
      const { auth } = require('@/auth');
      auth.mockResolvedValue({
        user: {
          id: 'user-123',
          permissionNames: ['user:read', 'user:write']
        }
      });
      
      const session = await AuthorizationService.requirePermission('user:read');
      expect(session.user.id).toBe('user-123');
    });
    
    it('denies access without permission', async () => {
      const { auth } = require('@/auth');
      auth.mockResolvedValue({
        user: {
          id: 'user-123',
          permissionNames: ['user:read']
        }
      });
      
      await expect(
        AuthorizationService.requirePermission('user:delete')
      ).rejects.toThrow('Insufficient permissions');
    });
    
    it('denies access when unauthenticated', async () => {
      const { auth } = require('@/auth');
      auth.mockResolvedValue(null);
      
      await expect(
        AuthorizationService.requirePermission('user:read')
      ).rejects.toThrow('Unauthorized');
    });
  });
});
```

## 📋 Security Checklist

### Pre-Deployment Security Review

```markdown
# Security Checklist

## Authentication & Authorization
- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] Strong password policy enforcement
- [ ] Session management with secure cookies
- [ ] JWT token expiration and refresh
- [ ] Role-based access control implemented
- [ ] Permission checks on all sensitive operations

## Input Validation
- [ ] Input sanitization for XSS prevention
- [ ] Schema validation with Zod
- [ ] SQL injection prevention with parameterized queries
- [ ] File upload validation and scanning
- [ ] Content type validation

## Network Security
- [ ] HTTPS enforcement in production
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] CORS configuration for cross-domain
- [ ] Rate limiting on authentication endpoints
- [ ] IP-based access controls if needed

## Data Protection
- [ ] Sensitive data encryption at rest
- [ ] Secure database connections
- [ ] Data minimization principles
- [ ] Secure file storage
- [ ] Backup encryption

## Monitoring & Logging
- [ ] Security event logging
- [ ] Suspicious activity detection
- [ ] Audit trail for sensitive operations
- [ ] Error handling without information leakage
- [ ] Regular security log reviews

## Dependencies
- [ ] Regular dependency updates
- [ ] Security vulnerability scanning
- [ ] No known vulnerabilities in production
- [ ] Secure dependency sources

## Infrastructure
- [ ] Secure environment variables
- [ ] Database access controls
- [ ] Network segmentation
- [ ] Regular security patches
- [ ] Backup and recovery procedures
```

---

**Next**: [Performance Optimization](../performance/optimization.md) → Application performance guidelines and implementation