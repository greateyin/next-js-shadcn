# Database Operations Guide

Comprehensive guide for database operations, migrations, queries, and best practices using Prisma ORM with PostgreSQL.

## 🗄️ Database Schema Overview

### Core Models

```prisma
// User model with authentication and role relationships
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  password      String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relationships
  accounts      Account[]
  sessions      Session[]
  userRoles     UserRole[]
  
  @@map("users")
}

// Role-based access control
model Role {
  id          String      @id @default(cuid())
  name        String      @unique
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relationships
  userRoles   UserRole[]
  permissions RolePermission[]
  
  @@map("roles")
}

// Permission system
model Permission {
  id          String            @id @default(cuid())
  name        String            @unique
  description String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  // Relationships
  rolePermissions RolePermission[]
  
  @@map("permissions")
}

// Many-to-many relationships
model UserRole {
  id     String @id @default(cuid())
  userId String
  roleId String
  
  // Relationships
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  
  // Relationships
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
  @@map("role_permissions")
}
```

## 🔄 Database Migrations

### Creating Migrations

```bash
# Generate new migration from schema changes
npx prisma migrate dev --name add_user_profile_fields

# Create migration without applying it
npx prisma migrate dev --create-only --name feature_branch_changes

# Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Migration Examples

```prisma
// Migration: Add user profile fields
model User {
  // ... existing fields
  phoneNumber String?
  dateOfBirth DateTime?
  bio         String?
  
  @@map("users")
}

// Migration: Add application-specific permissions
model Application {
  id          String   @id @default(cuid())
  name        String   @unique
  domain      String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  menuItems MenuItem[]
  
  @@map("applications")
}

model MenuItem {
  id            String       @id @default(cuid())
  name          String
  displayName   String
  path          String
  icon          String?
  parentId      String?
  applicationId String
  order         Int
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  // Relationships
  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  parent      MenuItem?   @relation("MenuItemHierarchy", fields: [parentId], references: [id])
  children    MenuItem[]  @relation("MenuItemHierarchy")
  
  @@map("menu_items")
}
```

### Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.create({
      data: { name: 'user:read', description: 'Read user data' },
    }),
    prisma.permission.create({
      data: { name: 'user:write', description: 'Create and update users' },
    }),
    prisma.permission.create({
      data: { name: 'user:delete', description: 'Delete users' },
    }),
    prisma.permission.create({
      data: { name: 'role:read', description: 'Read role data' },
    }),
    prisma.permission.create({
      data: { name: 'role:write', description: 'Create and update roles' },
    }),
  ])

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: {
        create: permissions.map(permission => ({
          permissionId: permission.id,
        })),
      },
    },
  })

  const userRole = await prisma.role.create({
    data: {
      name: 'user',
      description: 'Regular user with basic access',
      permissions: {
        create: [
          { permissionId: permissions[0].id }, // user:read
          { permissionId: permissions[3].id }, // role:read
        ],
      },
    },
  })

  // Create applications
  const mainApp = await prisma.application.create({
    data: {
      name: 'main',
      domain: 'localhost:3000',
      description: 'Main application',
    },
  })

  // Create menu items
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'dashboard',
        displayName: 'Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        applicationId: mainApp.id,
        order: 1,
      },
      {
        name: 'profile',
        displayName: 'Profile',
        path: '/profile',
        icon: 'User',
        applicationId: mainApp.id,
        order: 2,
      },
    ],
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## 📊 Query Operations

### Basic CRUD Operations

```typescript
// User operations
import { db } from '@/lib/db'

// Create user
const newUser = await db.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    userRoles: {
      create: {
        role: {
          connect: { name: 'user' }
        }
      }
    }
  },
  include: {
    userRoles: {
      include: {
        role: true
      }
    }
  }
})

// Read user with roles and permissions
const user = await db.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
})

// Update user
const updatedUser = await db.user.update({
  where: { id: 'user-id' },
  data: {
    name: 'Updated Name',
    userRoles: {
      create: {
        role: {
          connect: { name: 'admin' }
        }
      }
    }
  }
})

// Delete user
await db.user.delete({
  where: { id: 'user-id' }
})
```

### Advanced Queries

```typescript
// Paginated user list
const users = await db.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  where: {
    email: {
      contains: search,
      mode: 'insensitive'
    }
  },
  include: {
    userRoles: {
      include: {
        role: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
})

const total = await db.user.count({
  where: {
    email: {
      contains: search,
      mode: 'insensitive'
    }
  }
})

// Users with specific permission
const usersWithPermission = await db.user.findMany({
  where: {
    userRoles: {
      some: {
        role: {
          permissions: {
            some: {
              permission: {
                name: 'user:write'
              }
            }
          }
        }
      }
    }
  }
})

// Hierarchical menu items
const menuItems = await db.menuItem.findMany({
  where: {
    application: {
      domain: 'localhost:3000'
    },
    parentId: null // Root level items
  },
  include: {
    children: {
      orderBy: {
        order: 'asc'
      },
      include: {
        children: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    }
  },
  orderBy: {
    order: 'asc'
  }
})
```

### Transaction Operations

```typescript
// Atomic operations with transactions
const result = await db.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: {
      email: 'newuser@example.com',
      name: 'New User'
    }
  })

  // Assign default role
  await tx.userRole.create({
    data: {
      userId: user.id,
      roleId: 'default-role-id'
    }
  })

  // Create user profile
  await tx.userProfile.create({
    data: {
      userId: user.id,
      bio: 'New user profile'
    }
  })

  return user
})

// Batch operations
await db.$transaction([
  db.user.update({
    where: { id: 'user-1' },
    data: { name: 'Updated User 1' }
  }),
  db.user.update({
    where: { id: 'user-2' },
    data: { name: 'Updated User 2' }
  }),
  db.user.update({
    where: { id: 'user-3' },
    data: { name: 'Updated User 3' }
  })
])
```

## 🔒 Security Best Practices

### Input Validation

```typescript
// Zod schema for user input
import { z } from 'zod'

const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  roleIds: z.array(z.string().cuid()).optional()
})

// Usage in API route
export async function POST(request: Request) {
  const body = await request.json()
  
  const validation = userCreateSchema.safeParse(body)
  if (!validation.success) {
    return Response.json(
      { error: 'Invalid input', details: validation.error.format() },
      { status: 400 }
    )
  }

  const { email, name, roleIds } = validation.data
  
  // Proceed with database operation
}
```

### Permission Checks

```typescript
// Utility function for permission checking
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) return false

  const permissions = user.userRoles.flatMap(userRole =>
    userRole.role.permissions.map(rp => rp.permission.name)
  )

  return permissions.includes(permissionName)
}

// Usage in server actions
export async function deleteUser(userId: string, targetUserId: string) {
  // Check if current user has permission
  const canDelete = await hasPermission(userId, 'user:delete')
  if (!canDelete) {
    throw new Error('Insufficient permissions')
  }

  // Perform deletion
  await db.user.delete({
    where: { id: targetUserId }
  })

  return { success: true }
}
```

## 📈 Performance Optimization

### Indexing Strategy

```prisma
// Add indexes for common query patterns
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  
  @@index([createdAt])
  @@map("users")
}

model UserRole {
  id     String @id @default(cuid())
  userId String
  roleId String
  
  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}
```

### Query Optimization

```typescript
// Use select to fetch only needed fields
const userEmails = await db.user.findMany({
  select: {
    id: true,
    email: true
  },
  where: {
    createdAt: {
      gte: new Date('2024-01-01')
    }
  }
})

// Batch operations for better performance
const userIds = ['user-1', 'user-2', 'user-3']
const users = await db.user.findMany({
  where: {
    id: {
      in: userIds
    }
  }
})

// Use raw queries for complex operations
const userStats = await db.$queryRaw`
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as user_count
  FROM users 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`
```

### Connection Pooling

```typescript
// lib/db.ts - Database connection with connection pooling
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Enable query logging in development
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

## 🔄 Data Migration Patterns

### Schema Evolution

```typescript
// Safe field addition
model User {
  // ... existing fields
  phoneNumber String? // Nullable field for backward compatibility
}

// Data migration script
async function migrateUserPhoneNumbers() {
  const users = await db.user.findMany({
    where: {
      phoneNumber: null
    }
  })

  for (const user of users) {
    // Migrate data from old field or external source
    await db.user.update({
      where: { id: user.id },
      data: {
        phoneNumber: user.oldPhoneField // If migrating from old field
      }
    })
  }
}
```

### Bulk Data Operations

```typescript
// Efficient bulk updates
async function updateUserRoles(batchSize = 1000) {
  let skip = 0
  let hasMore = true

  while (hasMore) {
    const users = await db.user.findMany({
      skip,
      take: batchSize,
      select: { id: true }
    })

    if (users.length === 0) {
      hasMore = false
      break
    }

    // Process batch
    for (const user of users) {
      await db.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: 'default-role-id'
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: 'default-role-id'
        }
      })
    }

    skip += batchSize
  }
}
```

## 🧪 Testing Database Operations

### Test Setup

```typescript
// tests/setup/database.ts
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const testPrisma = new PrismaClient()

export async function setupTestDatabase() {
  // Generate test database URL
  const testDbUrl = process.env.DATABASE_URL + '_test'
  
  // Create test database if it doesn't exist
  try {
    execSync(`npx prisma migrate reset --force`, {
      env: { ...process.env, DATABASE_URL: testDbUrl }
    })
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }

  return testPrisma
}

export async function cleanupTestDatabase() {
  await testPrisma.$disconnect()
}
```

### Database Tests

```typescript
// tests/integration/userOperations.test.ts
import { db } from '@/lib/db'
import { setupTestDatabase, cleanupTestDatabase } from '../setup/database'

describe('User Operations', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    // Clean up test data
    await db.user.deleteMany()
    await db.role.deleteMany()
  })

  it('creates user with roles', async () => {
    const role = await db.role.create({
      data: {
        name: 'test-role',
        description: 'Test role'
      }
    })

    const user = await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        userRoles: {
          create: {
            roleId: role.id
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    expect(user.email).toBe('test@example.com')
    expect(user.userRoles).toHaveLength(1)
    expect(user.userRoles[0].role.name).toBe('test-role')
  })

  it('prevents duplicate emails', async () => {
    await db.user.create({
      data: {
        email: 'duplicate@example.com',
        name: 'First User'
      }
    })

    await expect(
      db.user.create({
        data: {
          email: 'duplicate@example.com',
          name: 'Second User'
        }
      })
    ).rejects.toThrow()
  })
})
```

## 📊 Monitoring and Maintenance

### Query Performance

```typescript
// Enable query logging in development
const db = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
})

db.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Duration: ' + e.duration + 'ms')
})
```

### Database Health Checks

```typescript
// Health check endpoint
export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`
    
    // Check key tables
    const userCount = await db.user.count()
    const roleCount = await db.role.count()
    
    return Response.json({
      status: 'healthy',
      database: 'connected',
      userCount,
      roleCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

# Clean up old backups (keep last 30 days)
find . -name "backup_*.sql" -mtime +30 -delete
```

---

**Next**: [Quick Start Guide](../quick-start.md) → Getting started with the application

**Previous**: [UI/UX Components](../ui-ux/components.md) → Component library and design system