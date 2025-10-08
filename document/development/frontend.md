# Frontend Development

Complete guide to frontend development with React 19, Next.js 15, and shadcn/ui components.

## 🎯 Overview

The frontend is built with modern React patterns and includes:

- **React 19** - Latest React features and performance improvements
- **Next.js 15** - App Router with server components and RSC
- **TypeScript** - Full type safety throughout the application
- **shadcn/ui** - Modern, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling with validation
- **Server Actions** - Direct server communication from components

## 🏗️ Project Structure

```
app/                          # Next.js App Router
├── layout.tsx                # Root layout with providers
├── page.tsx                  # Landing page
├── auth/                     # Authentication pages
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
├── admin/                    # Admin dashboard
│   ├── layout.tsx
│   ├── page.tsx
│   ├── users/
│   │   └── page.tsx
│   └── roles/
│       └── page.tsx
└── dashboard/                # User dashboard
    ├── layout.tsx
    └── page.tsx

components/                   # React components
├── ui/                       # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── form.tsx
│   └── ...
├── auth/                     # Authentication components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── Social.tsx
├── admin/                    # Admin-specific components
│   ├── AdminLayoutClient.tsx
│   ├── AdminSidebar.tsx
│   └── users/
│       └── UsersTable.tsx
└── providers/                # Context providers
    ├── SessionProvider.tsx
    ├── theme-provider.tsx
    └── toaster-provider.tsx
```

## 🎨 UI Components

### shadcn/ui Integration

The project uses shadcn/ui components with custom theming:

```typescript
// Example: Custom button component
import { Button } from "@/components/ui/button";

export function PrimaryButton({ children, ...props }) {
  return (
    <Button 
      variant="default" 
      size="lg"
      className="bg-primary text-primary-foreground hover:bg-primary/90"
      {...props}
    >
      {children}
    </Button>
  );
}
```

### Component Patterns

#### Server Components

```typescript
// app/admin/users/page.tsx
import { auth } from "@/auth";
import { UsersTable } from "@/components/admin/users/UsersTable";

export default async function UsersPage() {
  const session = await auth();
  
  // Server-side authentication check
  if (!session?.user.roleNames?.includes('admin')) {
    return <div>Access Denied</div>;
  }
  
  // Server-side data fetching
  const users = await db.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UsersTable users={users} />
    </div>
  );
}
```

#### Client Components

```typescript
// components/admin/users/UsersTable.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { User } from '@prisma/client';

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setSelectedUser(user)}
            >
              Edit
            </Button>
          </div>
        ))}
      </div>
      
      {/* Edit user dialog */}
      {selectedUser && (
        <EditUserDialog 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
```

## 📝 Form Handling

### React Hook Form Integration

```typescript
// components/auth/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginFormData } from '@/schemas/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      // Use server action for authentication
      const result = await login(data);
      
      if (result?.error) {
        form.setError('root', { message: result.error });
      } else {
        // Redirect on success
        window.location.href = '/dashboard';
      }
    } catch (error) {
      form.setError('root', { message: 'An unexpected error occurred' });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Enter your password" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.formState.errors.root && (
          <div className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}
```

## 🔄 State Management

### Session State

```typescript
// components/providers/SessionProvider.tsx
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: any;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
```

### Theme State

```typescript
// components/providers/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}

// Custom hook for theme
import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  
  return {
    theme,
    setTheme,
    isDark
  };
}
```

## 🎛️ Server Actions

### Authentication Actions

```typescript
// actions/auth/index.ts
'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function login(credentials: LoginFormData) {
  try {
    const result = await signIn('credentials', {
      ...credentials,
      redirect: false
    });
    
    return result;
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

export async function updateUserProfile(data: ProfileUpdateData) {
  const session = await auth();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  // Validate and update user
  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      email: data.email
    }
  });
  
  // Revalidate cache
  revalidatePath('/profile');
  
  return user;
}
```

## 📱 Responsive Design

### Tailwind CSS Breakpoints

```typescript
// Responsive layout example
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:block w-64 bg-muted p-6">
        <DashboardSidebar />
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Mobile menu button */}
        <div className="md:hidden mb-4">
          <MobileMenuButton />
        </div>
        
        {children}
      </main>
    </div>
  );
}
```

### Mobile-First Approach

```typescript
// Mobile-first component
export function UserCard({ user }: { user: User }) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.image} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{user.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline">View</Button>
          <Button size="sm">Edit</Button>
        </div>
      </div>
    </div>
  );
}
```

## 🎭 Error Handling

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-destructive rounded-lg">
          <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {this.state.error?.message}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Loading States

```typescript
// components/LoadingSpinner.tsx
export function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`} />
  );
}

// Usage in components
export function UserProfile() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Render user profile
}
```

## 🔧 Development Tools

### ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import next from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': next
    },
    rules: {
      ...next.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off'
    }
  }
];
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2015",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🚀 Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
});

export function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <HeavyChart />
    </div>
  );
}
```

### Image Optimization

```typescript
import Image from 'next/image';

export function UserAvatar({ user }: { user: User }) {
  return (
    <Image
      src={user.image || '/default-avatar.png'}
      alt={`${user.name}'s avatar`}
      width={40}
      height={40}
      className="rounded-full"
      priority={false} // Only prioritize above-fold images
    />
  );
}
```

## 🧪 Testing

### Component Testing

```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock server action
jest.mock('@/actions/auth', () => ({
  login: jest.fn()
}));

describe('LoginForm', () => {
  it('should validate email format', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

---

**Next**: [Backend Development](./backend.md) → API routes and server actions implementation