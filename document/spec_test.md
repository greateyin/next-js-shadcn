# Testing Specification

## Overview
This document outlines the testing strategy and implementation details for the application, covering unit tests, integration tests, and end-to-end tests.

## Testing Architecture

### 1. Directory Structure
```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/
│   ├── api/
│   └── auth/
└── e2e/
    ├── auth/
    └── features/
```

## Testing Frameworks

### 1. Unit Testing
- Jest for test runner
- React Testing Library for component testing
- MSW for API mocking

### 2. Integration Testing
- Jest for test environment
- Supertest for API testing
- Test database for data layer

### 3. E2E Testing
- Playwright for browser automation
- Custom fixtures and helpers
- Visual regression testing

## Test Types

### 1. Unit Tests
```typescript
// components/auth/__tests__/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'
import { loginAction } from '@/actions/auth/authActions'

jest.mock('@/actions/auth/authActions')

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders login form correctly', () => {
        render(<LoginForm />)
        
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('handles form submission correctly', async () => {
        const mockLoginAction = loginAction as jest.Mock
        mockLoginAction.mockResolvedValueOnce({ success: true })

        render(<LoginForm />)

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' }
        })
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

        await waitFor(() => {
            expect(mockLoginAction).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            })
        })
    })

    it('displays error message on failed login', async () => {
        const mockLoginAction = loginAction as jest.Mock
        mockLoginAction.mockResolvedValueOnce({ error: 'Invalid credentials' })

        render(<LoginForm />)

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpassword' }
        })
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
        })
    })
})
```

### 2. Integration Tests
```typescript
// integration/auth/login.test.ts
import { createMocks } from 'node-mocks-http'
import { loginHandler } from '@/app/api/auth/login/route'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

describe('Login API', () => {
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })

    it('authenticates user with valid credentials', async () => {
        const hashedPassword = await hash('password123', 12)
        await prisma.user.create({
            data: {
                email: 'test@example.com',
                password: hashedPassword
            }
        })

        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'test@example.com',
                password: 'password123'
            }
        })

        await loginHandler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const jsonResponse = JSON.parse(res._getData())
        expect(jsonResponse).toHaveProperty('token')
    })

    it('returns error for invalid credentials', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            }
        })

        await loginHandler(req, res)

        expect(res._getStatusCode()).toBe(401)
        const jsonResponse = JSON.parse(res._getData())
        expect(jsonResponse).toHaveProperty('error', 'Invalid credentials')
    })
})
```

### 3. E2E Tests
```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login')
    })

    test('successful login redirects to dashboard', async ({ page }) => {
        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="password"]', 'password123')
        await page.click('button[type="submit"]')

        await expect(page).toHaveURL('/dashboard')
        await expect(page.locator('text=Welcome back')).toBeVisible()
    })

    test('displays error for invalid credentials', async ({ page }) => {
        await page.fill('input[name="email"]', 'wrong@example.com')
        await page.fill('input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')

        await expect(page.locator('text=Invalid credentials')).toBeVisible()
        await expect(page).toHaveURL('/auth/login')
    })

    test('validates form fields', async ({ page }) => {
        await page.click('button[type="submit"]')

        await expect(page.locator('text=Email is required')).toBeVisible()
        await expect(page.locator('text=Password is required')).toBeVisible()
    })
})
```

## Test Configuration

### 1. Jest Configuration
```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'babel-jest',
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
}
```

### 2. Playwright Configuration
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
    testDir: './e2e',
    use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'Chrome',
            use: { browserName: 'chromium' },
        },
        {
            name: 'Firefox',
            use: { browserName: 'firefox' },
        },
        {
            name: 'Safari',
            use: { browserName: 'webkit' },
        },
    ],
}

export default config
```

## Testing Patterns

### 1. Component Testing
- Test component rendering
- Verify user interactions
- Check state updates
- Validate prop types

### 2. Hook Testing
- Test custom hooks
- Verify state management
- Check side effects
- Test error handling

### 3. API Testing
- Test endpoint responses
- Verify error handling
- Check authentication
- Validate data formats

## Performance Testing

### 1. Load Testing
- Test concurrent users
- Measure response times
- Check resource usage
- Monitor error rates

### 2. Stress Testing
- Test system limits
- Check recovery behavior
- Monitor memory usage
- Verify data integrity

## Security Testing

### 1. Authentication Tests
- Test login flows
- Verify token handling
- Check password reset
- Test session management

### 2. Authorization Tests
- Test access control
- Verify role permissions
- Check API security
- Test data protection

## Accessibility Testing

### 1. Component Testing
- Test ARIA attributes
- Check keyboard navigation
- Verify screen reader support
- Test color contrast

### 2. Page Testing
- Test page structure
- Check focus management
- Verify form accessibility
- Test error messages

## Test Data Management

### 1. Fixtures
- Create test data
- Manage test state
- Handle cleanup
- Share common data

### 2. Mocking
- Mock API responses
- Simulate errors
- Handle async operations
- Test edge cases

## CI/CD Integration

### 1. GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Dependencies
```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.5",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.39.0",
    "msw": "^2.0.1"
  }
}
```
