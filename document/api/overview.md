# API Overview

Complete documentation of the REST API endpoints for the Next.js 15 + Auth.js v5 application.

## 📋 API Structure

The API follows RESTful principles and is organized by functionality:

```
app/api/
├── auth/                   # Authentication endpoints
│   ├── [...nextauth]/
│   │   └── route.ts       # NextAuth.js API route
│   ├── session/
│   │   └── route.ts       # Session management
│   ├── providers/
│   │   └── route.ts       # OAuth providers
│   └── validate-credentials/
│       └── route.ts       # Credential validation
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

## 🔐 Authentication APIs

### Session Information

**GET** `/api/auth/session`

Get current user session information.

```typescript
// Response
{
  "authenticated": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["user", "admin"],
    "permissions": ["user:read", "user:write"],
    "applications": ["dashboard", "admin"]
  }
}
```

### Validate Credentials

**POST** `/api/auth/validate-credentials`

Validate user credentials without signing in.

```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### OAuth Providers

**GET** `/api/auth/providers`

Get available OAuth providers.

```typescript
// Response
{
  "providers": [
    {
      "id": "google",
      "name": "Google",
      "type": "oauth"
    },
    {
      "id": "github", 
      "name": "GitHub",
      "type": "oauth"
    }
  ]
}
```

## 👥 User Management APIs

### Get All Users

**GET** `/api/admin/users`

Get paginated list of users (Admin only).

```typescript
// Query Parameters
{
  page?: number;      // Page number (default: 1)
  limit?: number;     // Items per page (default: 20)
  search?: string;    // Search term
  role?: string;      // Filter by role
  status?: string;    // Filter by status
}

// Response
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "status": "active",
      "roles": ["user"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastLogin": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get User by ID

**GET** `/api/admin/users/[userId]`

Get detailed user information (Admin only).

```typescript
// Response
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "isTwoFactorEnabled": false,
    "emailVerified": "2025-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "roles": [
      {
        "id": "role_123",
        "name": "user",
        "description": "Regular user"
      }
    ],
    "permissions": [
      {
        "id": "perm_123",
        "name": "user:read",
        "description": "Read user data"
      }
    ]
  }
}
```

### Create User

**POST** `/api/admin/users`

Create a new user (Admin only).

```typescript
// Request
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "securepassword123",
  "roleIds": ["role_123", "role_456"]
}

// Response
{
  "user": {
    "id": "user_new_123",
    "email": "newuser@example.com",
    "name": "New User",
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update User

**PUT** `/api/admin/users/[userId]`

Update user information (Admin only).

```typescript
// Request
{
  "name": "Updated Name",
  "status": "active",
  "roleIds": ["role_123"]
}

// Response
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "Updated Name",
    "status": "active",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

### Delete User

**DELETE** `/api/admin/users/[userId]`

Delete a user (Admin only).

```typescript
// Response
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 🎭 Role Management APIs

### Get All Roles

**GET** `/api/admin/roles`

Get all roles with pagination (Admin only).

```typescript
// Response
{
  "roles": [
    {
      "id": "role_123",
      "name": "admin",
      "description": "Administrator role",
      "userCount": 5,
      "permissionCount": 25,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

### Get Role by ID

**GET** `/api/admin/roles/[roleId]`

Get detailed role information (Admin only).

```typescript
// Response
{
  "role": {
    "id": "role_123",
    "name": "admin",
    "description": "Administrator role",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "users": [
      {
        "id": "user_123",
        "email": "admin@example.com",
        "name": "Admin User"
      }
    ],
    "permissions": [
      {
        "id": "perm_123",
        "name": "user:create",
        "description": "Create users"
      }
    ],
    "applications": [
      {
        "id": "app_123",
        "name": "admin",
        "displayName": "Admin Dashboard"
      }
    ]
  }
}
```

### Create Role

**POST** `/api/admin/roles`

Create a new role (Admin only).

```typescript
// Request
{
  "name": "moderator",
  "description": "Content moderator role",
  "permissionIds": ["perm_123", "perm_456"],
  "applicationIds": ["app_123"]
}

// Response
{
  "role": {
    "id": "role_new_123",
    "name": "moderator",
    "description": "Content moderator role",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Role

**PUT** `/api/admin/roles/[roleId]`

Update role information (Admin only).

```typescript
// Request
{
  "name": "updated-moderator",
  "description": "Updated moderator role",
  "permissionIds": ["perm_123"],
  "applicationIds": ["app_123", "app_456"]
}

// Response
{
  "role": {
    "id": "role_123",
    "name": "updated-moderator",
    "description": "Updated moderator role",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

### Delete Role

**DELETE** `/api/admin/roles/[roleId]`

Delete a role (Admin only).

```typescript
// Response
{
  "success": true,
  "message": "Role deleted successfully"
}
```

## 📱 Application Management APIs

### Get All Applications

**GET** `/api/admin/applications`

Get all applications (Admin only).

```typescript
// Response
{
  "applications": [
    {
      "id": "app_123",
      "name": "dashboard",
      "displayName": "User Dashboard",
      "description": "Main user dashboard application",
      "path": "/dashboard",
      "isActive": true,
      "icon": "LayoutDashboard",
      "order": 1,
      "roleCount": 3,
      "menuItemCount": 8,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Application

**POST** `/api/admin/applications`

Create a new application (Admin only).

```typescript
// Request
{
  "name": "reports",
  "displayName": "Reports Dashboard",
  "description": "Analytics and reporting application",
  "path": "/reports",
  "icon": "BarChart3",
  "order": 3
}

// Response
{
  "application": {
    "id": "app_new_123",
    "name": "reports",
    "displayName": "Reports Dashboard",
    "path": "/reports",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Application

**PUT** `/api/admin/applications/[appId]`

Update application information (Admin only).

```typescript
// Request
{
  "displayName": "Updated Reports",
  "description": "Updated analytics dashboard",
  "isActive": false,
  "order": 4
}

// Response
{
  "application": {
    "id": "app_123",
    "name": "reports",
    "displayName": "Updated Reports",
    "description": "Updated analytics dashboard",
    "isActive": false,
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

## 🗂️ Menu System APIs

### Get User Menu

**GET** `/api/menu`

Get menu items accessible to the current user.

```typescript
// Query Parameters
{
  application?: string;  // Filter by application
}

// Response
{
  "menuItems": [
    {
      "id": "menu_123",
      "name": "dashboard",
      "displayName": "Dashboard",
      "path": "/dashboard",
      "icon": "LayoutDashboard",
      "type": "LINK",
      "order": 1,
      "children": [
        {
          "id": "menu_456",
          "name": "profile",
          "displayName": "Profile",
          "path": "/dashboard/profile",
          "icon": "User",
          "type": "LINK",
          "order": 1
        }
      ]
    }
  ]
}
```

### Get All Menu Items

**GET** `/api/admin/menu-items`

Get all menu items (Admin only).

```typescript
// Response
{
  "menuItems": [
    {
      "id": "menu_123",
      "name": "dashboard",
      "displayName": "Dashboard",
      "path": "/dashboard",
      "icon": "LayoutDashboard",
      "type": "LINK",
      "application": {
        "id": "app_123",
        "name": "dashboard",
        "displayName": "User Dashboard"
      },
      "parent": null,
      "children": [...],
      "roleAccess": [
        {
          "roleId": "role_123",
          "roleName": "user",
          "canView": true,
          "canAccess": true
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Menu Item

**POST** `/api/admin/menu-items`

Create a new menu item (Admin only).

```typescript
// Request
{
  "name": "settings",
  "displayName": "Settings",
  "path": "/dashboard/settings",
  "icon": "Settings",
  "type": "LINK",
  "applicationId": "app_123",
  "parentId": "menu_123",
  "order": 5,
  "roleAccess": [
    {
      "roleId": "role_123",
      "canView": true,
      "canAccess": true
    }
  ]
}

// Response
{
  "menuItem": {
    "id": "menu_new_123",
    "name": "settings",
    "displayName": "Settings",
    "path": "/dashboard/settings",
    "type": "LINK",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## 📊 Statistics APIs

### Admin Statistics

**GET** `/api/admin/stats`

Get admin dashboard statistics (Admin only).

```typescript
// Response
{
  "stats": {
    "totalUsers": 150,
    "activeUsers": 120,
    "pendingUsers": 15,
    "totalRoles": 8,
    "totalApplications": 5,
    "recentSignups": [
      {
        "id": "user_123",
        "email": "newuser@example.com",
        "name": "New User",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "userActivity": {
      "today": 45,
      "thisWeek": 320,
      "thisMonth": 1200
    }
  }
}
```

## 🔒 Error Responses

All API endpoints follow a consistent error response format:

```typescript
// Error Response
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",        // Optional error code
  "details": { ... }           // Optional additional details
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `INTERNAL_ERROR` - Server error

## 🔐 Authentication Requirements

### Public Endpoints

- `GET /api/auth/session`
- `POST /api/auth/validate-credentials`
- `GET /api/auth/providers`
- `GET /api/menu` (for current user)

### Admin-Only Endpoints

All endpoints under `/api/admin/` require:
- Valid authentication session
- User has `admin` role
- Appropriate permissions

### Permission-Based Access

Some endpoints require specific permissions:
- `user:read` - Read user data
- `user:write` - Create/update users
- `role:manage` - Manage roles
- `application:manage` - Manage applications

## 🌐 CORS Configuration

The API supports cross-origin requests with proper CORS headers:

```typescript
// next.config.mjs
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
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET,POST,PUT,DELETE,OPTIONS"
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization, X-Requested-With"
        }
      ]
    }
  ];
}
```

## 📝 Rate Limiting

API endpoints implement rate limiting to prevent abuse:

- Authentication endpoints: 10 requests per minute
- Admin endpoints: 100 requests per minute
- General endpoints: 1000 requests per minute

---

**Next**: [Authentication API](./authentication.md) → Detailed authentication endpoint documentation