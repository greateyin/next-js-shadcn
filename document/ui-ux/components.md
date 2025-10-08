# UI/UX Components Documentation

Comprehensive documentation for the shadcn/ui component library implementation and custom components used throughout the application.

## 🎨 Design System Overview

### Color Palette

```css
/* Tailwind CSS Color System */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### Typography Scale

```css
/* Tailwind Typography Classes */
.text-xs      { font-size: 0.75rem; line-height: 1rem; }
.text-sm      { font-size: 0.875rem; line-height: 1.25rem; }
.text-base    { font-size: 1rem; line-height: 1.5rem; }
.text-lg      { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl      { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl     { font-size: 1.5rem; line-height: 2rem; }
.text-3xl     { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl     { font-size: 2.25rem; line-height: 2.5rem; }
```

### Spacing System

```css
/* Tailwind Spacing Scale */
.p-1  { padding: 0.25rem; }  /* 4px */
.p-2  { padding: 0.5rem; }   /* 8px */
.p-3  { padding: 0.75rem; }  /* 12px */
.p-4  { padding: 1rem; }     /* 16px */
.p-6  { padding: 1.5rem; }   /* 24px */
.p-8  { padding: 2rem; }     /* 32px */
```

## 🔘 Core Components

### Button Component

**File**: `components/ui/button.tsx`

#### Variants

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

#### Usage Examples

```tsx
import { Button } from "@/components/ui/button"

// Default button
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Secondary button
<Button variant="secondary">Save as Draft</Button>

// Ghost button
<Button variant="ghost">View Details</Button>

// Link button
<Button variant="link">Learn More</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <PlusIcon />
</Button>

// With icons
<Button>
  <DownloadIcon />
  Download
</Button>

// Disabled state
<Button disabled>Processing...</Button>
```

#### Props Interface

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### Card Component

**File**: `components/ui/card.tsx`

#### Component Structure

```typescript
// Card components available:
- Card
- CardHeader
- CardTitle
- CardDescription
- CardContent
- CardFooter
```

#### Usage Examples

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <p>Card footer content</p>
  </CardFooter>
</Card>

// Authentication card
<Card className="w-full max-w-md">
  <CardHeader className="space-y-1">
    <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
    <CardDescription>
      Enter your email and password to sign in
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Form content */}
  </CardContent>
</Card>

// Dashboard card
<Card className="p-6">
  <CardHeader className="p-0 pb-4">
    <CardTitle className="text-lg font-semibold">
      Performance Metrics
    </CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    {/* Metrics content */}
  </CardContent>
</Card>
```

### Form Components

**File**: `components/ui/form.tsx`

#### Form Structure

```typescript
// Form components available:
- Form (FormProvider)
- FormField
- FormItem
- FormLabel
- FormControl
- FormDescription
- FormMessage
- useFormField
```

#### Usage with React Hook Form

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Your email address for notifications.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## 🔐 Authentication Components

### AuthCardWrapper

**File**: `components/auth/common/AuthCardWrapper.tsx`

#### Component Purpose

Wrapper component that provides consistent layout for authentication pages including header, content area, social login options, and navigation.

#### Props Interface

```typescript
interface AuthCardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  className?: string;
}
```

#### Usage Examples

```tsx
import { AuthCardWrapper } from "@/components/auth/common/AuthCardWrapper"

// Login page
<AuthCardWrapper
  headerLabel="Sign In"
  backButtonLabel="Don't have an account? Sign up"
  backButtonHref="/auth/register"
  showSocial={true}
>
  {/* Login form content */}
</AuthCardWrapper>

// Register page
<AuthCardWrapper
  headerLabel="Create Account"
  backButtonLabel="Already have an account? Sign in"
  backButtonHref="/auth/login"
  showSocial={true}
>
  {/* Registration form content */}
</AuthCardWrapper>

// Reset password page
<AuthCardWrapper
  headerLabel="Reset Password"
  backButtonLabel="Back to login"
  backButtonHref="/auth/login"
  showSocial={false}
>
  {/* Reset password form content */}
</AuthCardWrapper>
```

#### Styling Features

- **Background**: White with 80% opacity and backdrop blur
- **Border**: Light gray with 50% opacity
- **Shadow**: Subtle shadow for depth
- **Layout**: Responsive max-width of 384px (max-w-md)

### Header Component

**File**: `components/auth/common/Header.tsx`

#### Component Structure

```tsx
interface HeaderProps {
  label: string;
}

export function Header({ label }: HeaderProps) {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
      <h1 className="text-3xl font-semibold">Auth</h1>
      <p className="text-muted-foreground text-sm">
        {label}
      </p>
    </div>
  );
}
```

### BackButton Component

**File**: `components/auth/common/BackButton.tsx`

#### Component Structure

```tsx
interface BackButtonProps {
  href: string;
  label: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Button
      variant="link"
      className="font-normal w-full"
      size="sm"
      asChild
    >
      <Link href={href}>
        {label}
      </Link>
    </Button>
  );
}
```

### Social Component

**File**: `components/auth/common/Social.tsx`

#### Component Structure

```tsx
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Social() {
  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: "/dashboard",
    })
  }

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("github")}
      >
        <FaGithub className="h-5 w-5" />
      </Button>
    </div>
  );
}
```

## 📱 Responsive Design Patterns

### Mobile-First Approach

```tsx
// Base styles (mobile)
<div className="p-4 space-y-4">
  {/* Content */}
</div>

// Tablet breakpoint (md: 768px)
<div className="p-4 md:p-6 space-y-4 md:space-y-6">
  {/* Content */}
</div>

// Desktop breakpoint (lg: 1024px)
<div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
  {/* Content */}
</div>
```

### Grid Layout Patterns

```tsx
// Single column (mobile)
<div className="grid grid-cols-1 gap-4">
  {/* Items */}
</div>

// Two columns (tablet)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* Items */}
</div>

// Three columns (desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
  {/* Items */}
</div>
```

### Flexbox Patterns

```tsx
// Horizontal layout
<div className="flex flex-row items-center gap-4">
  {/* Items */}
</div>

// Vertical layout
<div className="flex flex-col space-y-4">
  {/* Items */}
</div>

// Responsive flex direction
<div className="flex flex-col md:flex-row items-center gap-4">
  {/* Items */}
</div>
```

## 🎯 Component Best Practices

### 1. Consistent Spacing

```tsx
// Good: Consistent spacing using Tailwind utilities
<div className="space-y-4 p-6">
  <h2 className="text-xl font-semibold">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// Avoid: Inconsistent spacing
<div>
  <h2 style={{ marginBottom: '16px' }}>Title</h2>
  <p style={{ marginTop: '8px' }}>Description</p>
</div>
```

### 2. Semantic HTML

```tsx
// Good: Semantic elements
<section className="space-y-6">
  <header>
    <h1 className="text-2xl font-bold">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </header>
  <main>
    {/* Main content */}
  </main>
  <footer>
    {/* Footer content */}
  </footer>
</section>
```

### 3. Accessible Forms

```tsx
// Good: Proper labeling and error handling
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="email">Email Address</FormLabel>
      <FormControl>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          aria-describedby="email-description email-error"
          {...field}
        />
      </FormControl>
      <FormDescription id="email-description">
        We'll never share your email with anyone else.
      </FormDescription>
      <FormMessage id="email-error" />
    </FormItem>
  )}
/>
```

### 4. Loading States

```tsx
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button type="submit" disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Processing..." : "Submit"}
    </Button>
  )
}
```

## 🎨 Customization Guide

### Adding New Variants

```tsx
// Extend existing variants
const extendedButtonVariants = cva(buttonVariants, {
  variants: {
    variant: {
      ...buttonVariants.variants?.variant,
      success: "bg-green-600 text-white hover:bg-green-700",
      warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    },
  },
})
```

### Theming Components

```tsx
// Custom theme using CSS variables
:root {
  --custom-primary: 142 76% 36%;
  --custom-primary-foreground: 355 100% 97%;
}

.custom-theme {
  --primary: var(--custom-primary);
  --primary-foreground: var(--custom-primary-foreground);
}
```

### Component Composition

```tsx
// Composing components with custom styling
function CustomCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn(
      "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200",
      className
    )}>
      {children}
    </Card>
  )
}
```

## 🔧 Component Testing

### Testing Setup

```typescript
// __tests__/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toHaveClass('bg-primary')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
  })
})
```

### Accessibility Testing

```typescript
// __tests__/components/auth/AuthCardWrapper.test.tsx
import { render, screen } from '@testing-library/react'
import { AuthCardWrapper } from '@/components/auth/common/AuthCardWrapper'

describe('AuthCardWrapper', () => {
  it('renders with proper accessibility attributes', () => {
    render(
      <AuthCardWrapper
        headerLabel="Sign In"
        backButtonLabel="Don't have an account?"
        backButtonHref="/auth/register"
      >
        <div>Form content</div>
      </AuthCardWrapper>
    )

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auth/register')
  })
})
```

---

**Next**: [Database Operations Guide](../database/operations.md) → Database queries, migrations, and operations