# Backend Development

Complete guide to backend development with Next.js 15 API routes, server actions, and database operations.

## 🏗️ Backend Architecture

### Overview

The backend is built using Next.js 15 with:

- **API Routes** - RESTful endpoints for external clients
- **Server Actions** - Direct server communication from components
- **Database Operations** - Prisma ORM with PostgreSQL
- **Authentication** - Auth.js v5 with cross-domain SSO
- **Middleware** - Route protection and request processing

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Server Actions │
│   Components    │◄──►│   (/api/*)      │◄──►│   (actions/*)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Middleware    │    │   Auth.js v5    │
                    │   (middleware.ts)│    │   (auth.config) │
                    │                 │    │                 │
                    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────────────────────────────┐
                    │           Database Layer                │
                    │           (Prisma + PostgreSQL)         │
                    └─────────────────────────────────────────┘
```

## 📡 API Routes

### Structure

```
app/api/
├── auth/                   # Authentication endpoints
│   ├── [...nextauth]/     # NextAuth.js route
│   │   └── route.ts
│   ├── session/           # Session management
│   │   └── route.ts
│   ├── providers/         # OAuth providers
│   │   └── route.ts
│   └── validate-credentials/
│       └── route.ts
├── admin/                  # Admin management APIs
│   ├── users/
│   │   ├── route.ts       # User management
│   │   └── [userId]/
│   │       └── route.ts   # Single user operations
│   ├── roles/
│   │   └── route.ts       # Role management
│   ├── applications/
│   │   └── route.ts       # Application management
│   └── stats/
│       └── route.ts       # Admin statistics
├── menu/
│   └── route.ts           # Dynamic menu system
└── applications/
    └── route.ts           # Application endpoints
```

### Basic API Route Pattern

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Permission check
    const hasPermission = session.user.permissionNames?.includes('user:read');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    // Database query
    const users = await db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await db.user.count({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    });
    
    // Response
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### Dynamic Route Parameters

```typescript
// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user can access this resource
    const canAccess = session.user.id === userId || 
      session.user.permissionNames?.includes('user:read');
    
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### POST Request Handling

```typescript
// app/api/users/route.ts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Permission check
    const hasPermission = session.user.permissionNames?.includes('user:create');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    const validatedData = CreateUserSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        status: 'pending'
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true
      }
    });
    
    // Assign default role if specified
    if (validatedData.roleId) {
      await db.userRole.create({
        data: {
          userId: user.id,
          roleId: validatedData.roleId
        }
      });
    }
    
    return NextResponse.json({ user }, { status: 201 });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

## 🔄 Server Actions

### Overview

Server Actions provide direct server communication from React components without API routes.

### Authentication Actions

```typescript
// actions/auth/index.ts
'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { LoginSchema } from '@/schemas/auth';

export async function login(credentials: unknown) {
  try {
    // Validate input
    const validatedFields = LoginSchema.safeParse(credentials);
    
    if (!validatedFields.success) {
      return { error: 'Invalid fields' };
    }
    
    const { email, password } = validatedFields.data;
    
    // Attempt sign in
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    
    if (result?.error) {
      switch (result.error) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' };
        default:
          return { error: 'Something went wrong' };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' };
        default:
          return { error: 'Something went wrong' };
      }
    }
    
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/auth/login' });
}
```

### Data Mutation Actions

```typescript
// actions/user/index.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { UpdateProfileSchema } from '@/schemas/user';

export async function updateProfile(data: unknown) {
  try {
    const session = await auth();
    
    if (!session?.user.id) {
      return { error: 'Unauthorized' };
    }
    
    // Validate input
    const validatedData = UpdateProfileSchema.parse(data);
    
    // Check if email is already taken by another user
    if (validatedData.email !== session.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: validatedData.email }
      });
      
      if (existingUser) {
        return { error: 'Email already in use' };
      }
    }
    
    // Update user
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        email: validatedData.email
      },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true
      }
    });
    
    // Revalidate cache
    revalidatePath('/profile');
    
    return { success: true, user: updatedUser };
    
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: 'Invalid data', details: error.errors };
    }
    
    console.error('Error updating profile:', error);
    return { error: 'Something went wrong' };
  }
}
```

### Admin Actions

```typescript
// actions/admin/users.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
  try {
    const session = await auth();
    
    // Permission check
    const hasPermission = session?.user.permissionNames?.includes('user:delete');
    if (!hasPermission) {
      return { error: 'Insufficient permissions' };
    }
    
    // Prevent self-deletion
    if (session.user.id === userId) {
      return { error: 'Cannot delete your own account' };
    }
    
    // Delete user
    await db.user.delete({
      where: { id: userId }
    });
    
    // Revalidate cache
    revalidatePath('/admin/users');
    
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error: 'Failed to delete user' };
  }
}
```

## 🗄️ Database Operations

### Prisma Client Setup

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

### Common Query Patterns

#### User with Roles and Permissions

```typescript
// Get user with complete role and permission data
async function getUserWithPermissions(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              },
              applications: {
                include: { application: true }
              }
            }
          }
        }
      }
    }
  });
}
```

#### Paginated Queries

```typescript
// Paginated user query
async function getUsersPaginated(options: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}) {
  const { page, limit, search, role } = options;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (role) {
    where.userRoles = {
      some: {
        role: {
          name: role
        }
      }
    };
  }
  
  const [users, total] = await Promise.all([
    db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    db.user.count({ where })
  ]);
  
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

#### Transaction Operations

```typescript
// Create user with role assignment (transaction)
async function createUserWithRole(userData: {
  email: string;
  name: string;
  password: string;
  roleIds: string[];
}) {
  return await db.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: await hashPassword(userData.password),
        status: 'pending'
      }
    });
    
    // Assign roles
    for (const roleId of userData.roleIds) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId
        }
      });
    }
    
    return user;
  });
}
```

## 🔐 Security Best Practices

### Input Validation

```typescript
// schemas/user.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleIds: z.array(z.string().cuid()).optional()
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
  roleIds: z.array(z.string().cuid()).optional()
});
```

### Rate Limiting

```typescript
// lib/rateLimiter.ts
import { rateLimit } from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
```

### Audit Logging

```typescript
// lib/audit/auditLogger.ts
export async function logAuditEvent(
  userId: string,
  action: string,
  status: 'SUCCESS' | 'FAILED',
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
      resourceId: metadata?.resourceId,
      resourceType: metadata?.resourceType,
      oldValue: metadata?.oldValue ? JSON.stringify(metadata.oldValue) : null,
      newValue: metadata?.newValue ? JSON.stringify(metadata.newValue) : null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}
```

## 🧪 Testing Backend Code

### API Route Testing

```typescript
// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/users/route';

// Mock auth and db
jest.mock('@/auth', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}));

describe('/api/users', () => {
  it('should return users when authenticated', async () => {
    // Mock authenticated session
    const { auth } = require('@/auth');
    auth.mockResolvedValue({
      user: {
        id: 'user-123',
        permissionNames: ['user:read']
      }
    });
    
    // Mock database response
    const { db } = require('@/lib/db');
    db.user.findMany.mockResolvedValue([
      { id: 'user-1', email: 'test@example.com', name: 'Test User' }
    ]);
    db.user.count.mockResolvedValue(1);
    
    // Create mock request
    const { req } = createMocks({
      method: 'GET',
      url: '/api/users?page=1&limit=10'
    });
    
    // Call API route
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });
});
```

### Server Action Testing

```typescript
// __tests__/actions/auth.test.ts
import { login } from '@/actions/auth';

// Mock dependencies
jest.mock('@/auth', () => ({
  signIn: jest.fn()
}));

jest.mock('@/schemas/auth', () => ({
  LoginSchema: {
    safeParse: jest.fn()
  }
}));

describe('login action', () => {
  it('should return success with valid credentials', async () => {
    // Mock validation
    const { LoginSchema } = require('@/schemas/auth');
    LoginSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: 'test@example.com', password: 'password123' }
    });
    
    // Mock successful sign in
    const { signIn } = require('@/auth');
    signIn.mockResolvedValue({});
    
    const result = await login({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result).toEqual({ success: true });
  });
});
```

## 🔧 Performance Optimization

### Database Query Optimization

```typescript
// Use select to only fetch needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Only include necessary fields
  },
  where: {
    // Use indexed fields in where clauses
    status: 'active',
    createdAt: {
      gte: new Date('2024-01-01')
    }
  },
  orderBy: {
    // Use indexed fields for ordering
    createdAt: 'desc'
  }
});
```

### Caching

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedUsers = unstable_cache(
  async (page: number, limit: number) => {
    return await getUsersPaginated({ page, limit });
  },
  ['users'], // cache key
  { revalidate: 60 } // revalidate every 60 seconds
);
```

### Connection Pooling

```typescript
// lib/db.ts with connection pooling
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query'], // Enable query logging in development
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export { prisma as db };
```

## 🐛 Error Handling

### Global Error Handler

```typescript
// lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  if (error instanceof ZodError) {
    return {
      error: 'Validation error',
      details: error.errors,
      statusCode: 400
    };
  }
  
  console.error('Unhandled error:', error);
  return {
    error: 'Internal server error',
    statusCode: 500
  };
}
```

### Error Response Format

```typescript
// Consistent error response format
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",        // Optional error code
  "details": { ... }           // Optional additional details
}
```

---

**Next**: [Deployment Guide](../deployment/production.md) → Production deployment and configuration