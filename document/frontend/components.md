# Component System Documentation

## Directory Structure

```
components/
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ResetPasswordForm.tsx
│   └── common/
├── ui/
│   ├── input.tsx
│   ├── button.tsx
│   └── label.tsx
└── layout/
    ├── Header.tsx
    ├── Footer.tsx
    └── Sidebar.tsx
```

## Component Guidelines

### Authentication Components

- Use form validation with Zod
- Implement error boundaries
- Handle loading states
- Support 2FA flows

### UI Components

- Follow shadcn/ui patterns
- Maintain accessibility
- Support dark mode
- Handle responsive layouts

### Layout Components

- Implement responsive design
- Handle navigation state
- Support dynamic content

## Best Practices

### Performance

- Use React.memo where appropriate
- Implement code splitting
- Optimize re-renders

### Accessibility

- Follow WCAG guidelines
- Support keyboard navigation
- Implement ARIA attributes

### Testing

- Unit test components
- Integration test flows
- E2E test critical paths

## Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-label": "^2.1.0",
    "@shadcn/ui": "latest"
  }
}
```
