# Database Schema

Complete documentation of the PostgreSQL database schema for the Next.js 15 + Auth.js v5 application.

## 📊 Schema Overview

The database uses Prisma ORM with a comprehensive schema supporting:

- **User Management** - Authentication and user profiles
- **Role-Based Access Control** - Flexible permission system
- **Multi-Application Support** - Multiple applications with shared authentication
- **Dynamic Menu System** - Configurable navigation menus
- **Audit Logging** - Security and compliance tracking

## 🗃️ Core Tables

### User Management

#### `User` Table

```prisma
model User {
  /// User's unique identifier
  id                    String                 @id @default(cuid())
  /// User's name
  name                  String?
  /// User's email address (must be unique)
  email                 String                 @unique
  /// Email verification timestamp
  emailVerified         DateTime?
  /// User's avatar URL
  image                 String?
  /// User's password (hashed)
  password              String?
  /// User's status
  status                UserStatus             @default(pending)
  /// Whether two-factor authentication is enabled
  isTwoFactorEnabled    Boolean                @default(false)
  /// Login attempt count
  loginAttempts         Int                    @default(0)
  /// Last login attempt timestamp
  lastLoginAttempt      DateTime?
  /// Last successful login timestamp
  lastSuccessfulLogin   DateTime?
  /// Login attempts reset timestamp
  loginAttemptsResetAt  DateTime?
  /// User creation timestamp
  createdAt             DateTime               @default(now())
  /// User last update timestamp
  updatedAt             DateTime               @updatedAt

  // Relationships
  accounts              Account[]
  auditLogs             AuditLog[]
  loginMethods          LoginMethod[]
  resetTokens           PasswordResetToken[]
  sessions              Session[]
  twoFactorConfirmation TwoFactorConfirmation?
  twoFactorTokens       TwoFactorToken[]
  userRoles             UserRole[]
  verificationTokens    VerificationToken[]
}
```

**Indexes:**
- `email` (unique)
- `status`
- `createdAt`
- `updatedAt`

#### `Account` Table (OAuth)

```prisma
model Account {
  /// User identifier
  userId            String
  /// Account type
  type              String
  /// Account provider (e.g., Google, GitHub)
  provider          String
  /// Provider-specific account identifier
  providerAccountId String
  /// Refresh token (optional) - recommended to encrypt
  refresh_token     String?   @db.Text
  /// Access token - recommended to encrypt
  access_token      String?   @db.Text
  /// Access token expiration time
  expires_at        Int?
  /// Token type
  token_type        String?
  /// Token scope
  scope             String?
  /// ID token (optional) - recommended to encrypt
  id_token          String?   @db.Text
  /// Session state
  session_state     String?
  /// Account creation timestamp
  createdAt         DateTime  @default(now())
  /// Account last update timestamp
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
  @@index([userId])
}
```

#### `Session` Table

```prisma
model Session {
  /// Session unique identifier
  id           String   @id @default(cuid())
  /// Session token - used to identify session
  sessionToken String   @unique
  /// User identifier
  userId       String
  /// Session expiration time
  expires      DateTime
  /// Last activity timestamp - for tracking user activity
  lastActivity DateTime @default(now())
  /// User agent - browser or device information
  userAgent    String?
  /// IP address - for security tracking
  ipAddress    String?
  /// Session creation timestamp
  createdAt    DateTime @default(now())
  /// Session last update timestamp
  updatedAt    DateTime @updatedAt
  /// Device identifier - for multi-device management
  deviceId     String?
  /// Session type (web, mobile, api)
  sessionType  String   @default("web")
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([deviceId])
  @@index([expires])      // For periodic cleanup of expired sessions
  @@index([lastActivity]) // For activity tracking queries
}
```

### Authentication Tokens

#### `VerificationToken` Table

```prisma
model VerificationToken {
  /// Verification token unique identifier
  id      String   @id @default(cuid())
  /// Email address to verify
  email   String
  /// Verification token value
  token   String   @unique
  /// Token expiration time
  expires DateTime
  /// Associated user ID (optional, for tracking and cascade delete)
  userId  String?
  /// Associated user
  user    User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([email, token])
  @@index([userId])   // For user-related queries
  @@index([expires])  // For periodic cleanup of expired tokens
}
```

#### `PasswordResetToken` Table

```prisma
model PasswordResetToken {
  /// Token unique identifier
  id      String   @id @default(cuid())
  /// Associated email address
  email   String
  /// Reset token value
  token   String   @unique
  /// Token expiration time
  expires DateTime
  /// Associated user ID
  userId  String?
  /// Associated user
  user    User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([email])
  @@index([userId])   // For user-related queries
  @@index([expires])  // For periodic cleanup of expired tokens
}
```

#### `TwoFactorToken` Table

```prisma
model TwoFactorToken {
  /// Two-factor token unique identifier
  id        String   @id @default(cuid())
  /// User identifier
  userId    String
  /// Two-factor token value
  token     String   @unique
  /// Token expiration time
  expires   DateTime
  /// Whether token has been used - prevent reuse
  used      Boolean  @default(false)
  /// Creation timestamp
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, token])
  @@index([userId])
  @@index([expires])  // For periodic cleanup of expired tokens
}
```

### Role-Based Access Control

#### `Role` Table

```prisma
model Role {
  /// Role unique identifier
  id           String            @id @default(cuid())
  /// Role name
  name         String            @unique
  /// Role description
  description  String?
  /// Creation timestamp
  createdAt    DateTime          @default(now())
  /// Update timestamp
  updatedAt    DateTime          @updatedAt
  
  /// Users associated with this role
  users        UserRole[]
  /// Permissions associated with this role
  permissions  RolePermission[]
  /// Applications associated with this role
  applications RoleApplication[]
  /// Menu items associated with this role
  menuItems    MenuItemRole[]
}
```

#### `Permission` Table

```prisma
model Permission {
  /// Permission unique identifier
  id          String         @id @default(cuid())
  /// Permission name
  name        String         @unique
  /// Permission description
  description String?
  /// Creation timestamp
  createdAt   DateTime       @default(now())
  /// Update timestamp
  updatedAt   DateTime       @updatedAt
  
  /// Roles associated with this permission
  roles       RolePermission[]
}
```

#### `UserRole` Table (Junction)

```prisma
model UserRole {
  /// User-role association unique identifier
  id        String   @id @default(cuid())
  /// User identifier
  userId    String
  /// Role identifier
  roleId    String
  /// Creation timestamp
  createdAt DateTime @default(now())
  /// Update timestamp
  updatedAt DateTime @updatedAt
  
  /// Associated user
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// Associated role
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@index([userId, roleId])  // Composite index: for permission check queries
}
```

#### `RolePermission` Table (Junction)

```prisma
model RolePermission {
  /// Role-permission association unique identifier
  id           String     @id @default(cuid())
  /// Role identifier
  roleId       String
  /// Permission identifier
  permissionId String
  /// Creation timestamp
  createdAt    DateTime   @default(now())
  /// Update timestamp
  updatedAt    DateTime   @updatedAt
  
  /// Associated role
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  /// Associated permission
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@index([roleId, permissionId])  // Composite index: for permission check queries
}
```

### Multi-Application Support

#### `Application` Table

```prisma
model Application {
  /// Application unique identifier
  id          String             @id @default(cuid())
  /// Application name
  name        String             @unique
  /// Application display name
  displayName String
  /// Application description
  description String?
  /// Whether application is active
  isActive    Boolean            @default(true)
  /// Application path
  path        String             @unique
  /// Application icon
  icon        String?
  /// Sort order
  order       Int                @default(0)
  /// Creation timestamp
  createdAt   DateTime           @default(now())
  /// Update timestamp
  updatedAt   DateTime           @updatedAt
  
  /// Roles associated with this application
  roles       RoleApplication[]
  /// Menu items associated with this application
  menuItems   MenuItem[]
}
```

#### `RoleApplication` Table (Junction)

```prisma
model RoleApplication {
  /// Role-application association unique identifier
  id            String      @id @default(cuid())
  /// Role identifier
  roleId        String
  /// Application identifier
  applicationId String
  /// Creation timestamp
  createdAt     DateTime    @default(now())
  /// Update timestamp
  updatedAt     DateTime    @updatedAt
  
  /// Associated role
  role          Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)
  /// Associated application
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@unique([roleId, applicationId])
  @@index([roleId])
  @@index([applicationId])
  @@index([roleId, applicationId])  // Composite index: for application access check
}
```

### Dynamic Menu System

#### `MenuItem` Table

```prisma
model MenuItem {
  /// Menu item unique identifier
  id            String          @id @default(cuid())
  /// Menu item name (internal use)
  name          String
  /// Display name (user interface display)
  displayName   String
  /// Menu item description (tooltip text)
  description   String?
  /// Menu item path (URL path)
  path          String
  /// Menu item icon (Lucide icon name, e.g., LayoutDashboard, Users, Settings)
  icon          String?
  /// Menu item type
  type          MenuItemType    @default(LINK)
  /// Parent menu item identifier (for hierarchical menus)
  parentId      String?
  /// Application identifier
  applicationId String
  /// Sort order (within same level)
  order         Int             @default(0)
  /// Whether to display (controls menu item visibility)
  isVisible     Boolean         @default(true)
  /// Whether disabled
  isDisabled    Boolean         @default(false)
  /// Creation timestamp
  createdAt     DateTime        @default(now())
  /// Update timestamp
  updatedAt     DateTime        @updatedAt
  
  /// Associated application
  application   Application     @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  /// Parent menu item
  parent        MenuItem?       @relation("MenuItemToMenuItem", fields: [parentId], references: [id], onDelete: SetNull)
  /// Child menu items list
  children      MenuItem[]      @relation("MenuItemToMenuItem")
  /// Menu item role access permissions
  roleAccess    MenuItemRole[]

  @@unique([applicationId, name])  // Ensure menu name is unique within application
  @@unique([applicationId, path])  // Ensure path is unique within application
  @@index([applicationId])
  @@index([parentId])
  @@index([parentId, order])       // For same-level sorting queries
  @@index([isVisible, order])      // For querying visible menus with sorting
  @@index([type])                  // For filtering by type
}
```

#### `MenuItemRole` Table (Junction)

```prisma
model MenuItemRole {
  /// Menu item-role association unique identifier
  id         String   @id @default(cuid())
  /// Menu item identifier
  menuItemId String
  /// Role identifier
  roleId     String
  /// Whether can view (display in menu)
  canView    Boolean  @default(true)
  /// Whether can access (can click to enter)
  canAccess  Boolean  @default(true)
  /// Creation timestamp
  createdAt  DateTime @default(now())
  /// Update timestamp
  updatedAt  DateTime @updatedAt
  
  /// Associated menu item
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  /// Associated role
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([menuItemId, roleId])     // Ensure menu item and role combination is unique
  @@index([menuItemId])
  @@index([roleId])
  @@index([roleId, canView])         // For querying role-visible menus
  @@index([menuItemId, canView])     // For querying menu item visible roles
}
```

### Audit Logging

#### `AuditLog` Table

```prisma
model AuditLog {
  /// Audit log unique identifier
  id           String   @id @default(cuid())
  /// Related user identifier (can be null, indicating system operation)
  userId       String?
  /// Audit action type (e.g., CREATE, UPDATE, DELETE)
  action       String
  /// Operation status (e.g., SUCCESS, FAILED)
  status       String
  /// Operation timestamp
  timestamp    DateTime @default(now())
  /// IP address - for security tracking
  ipAddress    String?
  /// User agent - browser or device information
  userAgent    String?
  /// Target user identifier (if applicable)
  targetUserId String?
  /// Resource identifier (if applicable)
  resourceId   String?
  /// Resource type (if applicable, e.g., User, Role, Permission)
  resourceType String?
  /// Old value (JSON string, if applicable)
  oldValue     String?  @db.Text
  /// New value (JSON string, if applicable)
  newValue     String?  @db.Text
  /// Operation reason or note
  reason       String?
  /// Additional metadata (JSON format)
  metadata     Json?
  /// Log priority (low, medium, high, critical)
  priority     String   @default("low")
  /// Related session ID (if applicable)
  sessionId    String?
  /// Associated user (set to null when user deleted to preserve history)
  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([timestamp])
  @@index([targetUserId])
  @@index([priority])
  @@index([resourceType])           // For querying by resource type
  @@index([sessionId])              // For tracking session-related logs
  @@index([userId, timestamp])      // Composite index: user time series queries
  @@index([action, timestamp])      // Composite index: action type time series queries
}
```

## 🔄 Enumerations

### User Status

```prisma
enum UserStatus {
  pending   // Pending verification
  active    // Active
  suspended // Suspended
  banned    // Banned
  deleted   // Deleted
  inactive  // Inactive
}
```

### Menu Item Types

```prisma
enum MenuItemType {
  LINK       // Regular link
  GROUP      // Group header (non-clickable)
  DIVIDER    // Divider line
  EXTERNAL   // External link
}
```

### Default Roles

```prisma
enum DefaultRole {
  user   // Regular user
  admin  // Administrator
}
```

## 🔍 Query Patterns

### User Permission Check

```typescript
// Check if user has specific permission
async function userHasPermission(userId: string, permissionName: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  return user?.userRoles.some(userRole =>
    userRole.role.permissions.some(rp =>
      rp.permission.name === permissionName
    )
  ) ?? false;
}
```

### Get User Menu Items

```typescript
// Get menu items accessible to user
async function getUserMenuItems(userId: string, applicationId: string) {
  return await db.menuItem.findMany({
    where: {
      applicationId,
      isVisible: true,
      roleAccess: {
        some: {
          role: {
            users: {
              some: { userId }
            }
          },
          canView: true
        }
      }
    },
    orderBy: [
      { parentId: 'asc' },
      { order: 'asc' }
    ],
    include: {
      children: {
        orderBy: { order: 'asc' }
      }
    }
  });
}
```

## 🛠️ Database Operations

### Prisma Client Usage

```typescript
import { db } from '@/lib/db';

// Create user
const user = await db.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    password: await hashPassword('password123')
  }
});

// Assign role to user
await db.userRole.create({
  data: {
    userId: user.id,
    roleId: role.id
  }
});

// Query with relationships
const userWithRoles = await db.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    }
  }
});
```

---

**Next**: [Authentication Flow](./authentication-flow.md) → Detailed Auth.js v5 implementation