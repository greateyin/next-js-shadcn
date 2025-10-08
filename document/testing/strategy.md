# Testing Strategy

Comprehensive testing approach for the Next.js 15 + Auth.js v5 application covering unit, integration, and end-to-end testing.

## 🎯 Testing Philosophy

### Testing Pyramid

```
      /\\\
     /  \\\
    / E2E \\\
   /Tests   \\\
  /----------\\\
 / Integration \\\
/    Tests      \\\
-------------------
/    Unit Tests    \
-------------------
```

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components and APIs
- **E2E Tests**: Test complete user flows and application behavior

### Testing Goals

- **Reliability**: Tests should be deterministic and reliable
- **Speed**: Fast feedback loop for developers
- **Coverage**: Critical paths and edge cases
- **Maintainability**: Easy to update and extend

## 🛠️ Testing Setup

### Dependencies

```json
// package.json - Testing dependencies
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest-environment-jsdom": "^29.0.0",
    "@playwright/test": "^1.40.0",
    "msw": "^1.3.0",
    "@types/jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Test Setup

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

## 🔬 Unit Testing

### Component Testing

```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock server actions
jest.mock('@/actions/auth', () => ({
  login: jest.fn(),
}));

describe('LoginForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const { login } = require('@/actions/auth');
    login.mockResolvedValue({ success: true });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('handles login errors', async () => {
    const { login } = require('@/actions/auth');
    login.mockResolvedValue({ error: 'Invalid credentials' });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

### Server Action Testing

```typescript
// __tests__/actions/auth.test.ts
import { login } from '@/actions/auth';

// Mock dependencies
jest.mock('@/auth', () => ({
  signIn: jest.fn(),
}));

jest.mock('@/schemas/auth', () => ({
  LoginSchema: {
    safeParse: jest.fn(),
  },
}));

describe('login action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success with valid credentials', async () => {
    const { LoginSchema } = require('@/schemas/auth');
    const { signIn } = require('@/auth');

    LoginSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: 'test@example.com', password: 'password123' },
    });

    signIn.mockResolvedValue({});

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ success: true });
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    });
  });

  it('returns error with invalid credentials', async () => {
    const { LoginSchema } = require('@/schemas/auth');
    const { signIn } = require('@/auth');

    LoginSchema.safeParse.mockReturnValue({
      success: false,
      error: { errors: [] },
    });

    const result = await login({
      email: 'invalid',
      password: '',
    });

    expect(result).toEqual({ error: 'Invalid fields' });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('handles authentication errors', async () => {
    const { LoginSchema } = require('@/schemas/auth');
    const { signIn } = require('@/auth');

    LoginSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: 'test@example.com', password: 'password123' },
    });

    signIn.mockResolvedValue({ error: 'CredentialsSignin' });

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ error: 'Invalid credentials' });
  });
});
```

### Utility Function Testing

```typescript
// __tests__/lib/permissions.test.ts
import { hasPermission, getUserPermissions } from '@/lib/permissions';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Permission Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('returns true when user has permission', async () => {
      const { db } = require('@/lib/db');
      
      db.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              permissions: [
                { permission: { name: 'user:read' } },
                { permission: { name: 'user:write' } },
              ],
            },
          },
        ],
      });

      const result = await hasPermission('user-123', 'user:read');
      expect(result).toBe(true);
    });

    it('returns false when user lacks permission', async () => {
      const { db } = require('@/lib/db');
      
      db.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              permissions: [
                { permission: { name: 'user:read' } },
              ],
            },
          },
        ],
      });

      const result = await hasPermission('user-123', 'user:delete');
      expect(result).toBe(false);
    });

    it('returns false when user not found', async () => {
      const { db } = require('@/lib/db');
      db.user.findUnique.mockResolvedValue(null);

      const result = await hasPermission('non-existent-user', 'user:read');
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('returns unique user permissions', async () => {
      const { db } = require('@/lib/db');
      
      db.user.findUnique.mockResolvedValue({
        userRoles: [
          {
            role: {
              permissions: [
                { permission: { name: 'user:read' } },
                { permission: { name: 'user:write' } },
              ],
            },
          },
          {
            role: {
              permissions: [
                { permission: { name: 'user:read' } }, // Duplicate
                { permission: { name: 'role:read' } },
              ],
            },
          },
        ],
      });

      const result = await getUserPermissions('user-123');
      expect(result).toEqual(['user:read', 'user:write', 'role:read']);
    });
  });
});
```

## 🔗 Integration Testing

### API Route Testing

```typescript
// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/users/route';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('returns users when authenticated with permission', async () => {
      const { auth } = require('@/auth');
      const { db } = require('@/lib/db');

      // Mock authenticated session
      auth.mockResolvedValue({
        user: {
          id: 'user-123',
          permissionNames: ['user:read'],
        },
      });

      // Mock database response
      db.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'test1@example.com', name: 'Test User 1' },
        { id: 'user-2', email: 'test2@example.com', name: 'Test User 2' },
      ]);
      db.user.count.mockResolvedValue(2);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?page=1&limit=10',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('returns 403 when user lacks permission', async () => {
      const { auth } = require('@/auth');

      auth.mockResolvedValue({
        user: {
          id: 'user-123',
          permissionNames: ['other:permission'],
        },
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users',
      });

      const response = await GET(req);
      expect(response.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
      const { auth } = require('@/auth');
      auth.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users',
      });

      const response = await GET(req);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('creates user with valid data', async () => {
      const { auth } = require('@/auth');
      const { db } = require('@/lib/db');

      auth.mockResolvedValue({
        user: {
          id: 'user-123',
          permissionNames: ['user:create'],
        },
      });

      db.user.findUnique.mockResolvedValue(null); // No existing user
      db.user.create.mockResolvedValue({
        id: 'new-user-123',
        email: 'new@example.com',
        name: 'New User',
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: {
          email: 'new@example.com',
          name: 'New User',
          password: 'password123',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.email).toBe('new@example.com');
    });
  });
});
```

### Database Integration Testing

```typescript
// __tests__/integration/database.test.ts
import { db } from '@/lib/db';

describe('Database Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await db.user.deleteMany();
    await db.role.deleteMany();
    await db.permission.deleteMany();
  });

  describe('User-Role-Permission Relationships', () => {
    it('creates user with roles and permissions', async () => {
      // Create test data
      const permission = await db.permission.create({
        data: { name: 'user:read', description: 'Read users' },
      });

      const role = await db.role.create({
        data: {
          name: 'viewer',
          description: 'Can view data',
          permissions: {
            create: { permissionId: permission.id },
          },
        },
      });

      const user = await db.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          userRoles: {
            create: { roleId: role.id },
          },
        },
        include: {
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

      expect(user.email).toBe('test@example.com');
      expect(user.userRoles).toHaveLength(1);
      expect(user.userRoles[0].role.permissions).toHaveLength(1);
      expect(user.userRoles[0].role.permissions[0].permission.name).toBe('user:read');
    });
  });
});
```

## 🌐 End-to-End Testing

### Playwright Setup

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in and access dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation and check URL
    await page.waitForURL('/dashboard');
    
    // Verify dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('user without permission cannot access admin', async ({ page }) => {
    // Login as regular user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to access admin page
    await page.goto('/admin');
    
    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });

  test('admin user can access admin panel', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Navigate to admin
    await page.goto('/admin');
    
    // Verify admin content
    await expect(page.locator('h1')).toContainText('Admin Panel');
    await expect(page.locator('text=User Management')).toBeVisible();
  });
});

// e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('admin can create new user', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Click create user button
    await page.click('text=Create User');
    
    // Fill user form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify user was created
    await expect(page.locator('text=User created successfully')).toBeVisible();
    await expect(page.locator('text=newuser@example.com')).toBeVisible();
  });

  test('admin can edit user', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Find user and click edit
    await page.click('tr:has-text("test@example.com") button:text("Edit")');
    
    // Update user name
    await page.fill('input[name="name"]', 'Updated Name');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=User updated successfully')).toBeVisible();
    await expect(page.locator('text=Updated Name')).toBeVisible();
  });
});
```

## 🧪 Test Utilities

### Test Data Factories

```typescript
// tests/factories/userFactory.ts
export const createUserData = (overrides = {}) => ({
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  password: 'password123',
  ...overrides,
});

export const createRoleData = (overrides = {}) => ({
  name: `role-${Date.now()}`,
  description: 'Test role',
  ...overrides,
});

export const createPermissionData = (overrides = {}) => ({
  name: `permission:${Date.now()}`,
  description: 'Test permission',
  ...overrides,
});
```

### Mock Service Worker

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock auth endpoints
  http.post('/api/auth/callback/credentials', () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock user endpoints
  http.get('/api/users', () => {
    return HttpResponse.json({
      users: [
        { id: '1', email: 'user1@example.com', name: 'User One' },
        { id: '2', email: 'user2@example.com', name: 'User Two' },
      ],
      pagination: { page: 1, limit: 10, total: 2, pages: 1 },
    });
  }),

  // Mock menu endpoints
  http.get('/api/menu', () => {
    return HttpResponse.json({
      menuItems: [
        { id: '1', name: 'dashboard', displayName: 'Dashboard', path: '/dashboard' },
        { id: '2', name: 'profile', displayName: 'Profile', path: '/profile' },
      ],
    });
  }),
];

// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## 📊 Test Coverage

### Coverage Configuration

```javascript
// jest.config.js - Coverage settings
module.exports = {
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './app/api/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './components/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage -- --coverageThreshold
```

## 🔄 Continuous Testing

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
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
      
      - run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          AUTH_SECRET: test-secret
          AUTH_URL: http://localhost:3000
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npx playwright install --with-deps
      
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          AUTH_SECRET: test-secret
          AUTH_URL: http://localhost:3000
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 🐛 Debugging Tests

### Debugging Unit Tests

```bash
# Run tests in debug mode
npm run test -- --verbose

# Run specific test with debug
npm run test -- --testNamePattern="login form" --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debugging E2E Tests

```bash
# Run tests in headed mode
npm run test:e2e:headed

# Run specific test
npm run test:e2e -- auth.spec.ts

# Debug with Playwright inspector
npx playwright test --debug

# Generate trace
npx playwright test --trace on
```

---

**Next**: [Security Best Practices](../security/best-practices.md) → Security guidelines and implementation