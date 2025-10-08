# Environment Variables Configuration

Complete guide for configuring environment variables for the Next.js 15 + Auth.js v5 application.

## 📋 Overview

Environment variables are used to configure the application for different environments (development, staging, production). This document describes all available environment variables and their usage.

## 🔐 Required Variables

### Core Configuration

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Authentication Secret (32 characters minimum)
AUTH_SECRET="your-32-character-super-secret-key-here"

# Application Base URL
AUTH_URL="https://auth.example.com"
```

### Cross-Domain SSO

```env
# Cookie Domain (for cross-domain authentication)
COOKIE_DOMAIN=".example.com"

# Allowed Domains (comma-separated)
ALLOWED_DOMAINS="auth.example.com,admin.example.com,dashboard.example.com"
```

## 🌐 OAuth Providers (Optional)

### Google OAuth

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### GitHub OAuth

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Other OAuth Providers

```env
# Microsoft OAuth
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

## ⚙️ Development Variables

### Local Development

```env
# Development Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/shadcn_template_dev"

# Development Authentication
AUTH_SECRET="development-secret-key-for-local-use-only"
AUTH_URL="http://localhost:3000"

# Development Cross-Domain
COOKIE_DOMAIN=".localhost"
ALLOWED_DOMAINS="localhost,auth.localhost,admin.localhost,app.localhost"

# Development OAuth (use local redirect URIs)
GOOGLE_CLIENT_ID="dev-google-client-id"
GOOGLE_CLIENT_SECRET="dev-google-client-secret"

# Enable debug mode
NEXTAUTH_DEBUG=true
DEBUG=next-auth:*

# Development logging
LOG_LEVEL="debug"
```

### Development with Docker

```env
# Docker Database
DATABASE_URL="postgresql://postgres:password@postgres:5432/shadcn_template_dev"

# Docker URLs
AUTH_URL="http://auth.localhost:3000"
COOKIE_DOMAIN=".localhost"
ALLOWED_DOMAINS="auth.localhost,admin.localhost,app.localhost"
```

## 🚀 Production Variables

### Production Environment

```env
# Production Database
DATABASE_URL="postgresql://prod-user:secure-password@prod-db.example.com:5432/prod_database"

# Production Authentication
AUTH_SECRET="production-32-character-super-secure-secret-key"
AUTH_URL="https://auth.example.com"

# Production Cross-Domain
COOKIE_DOMAIN=".example.com"
ALLOWED_DOMAINS="auth.example.com,admin.example.com,dashboard.example.com,reports.example.com"

# Production OAuth
GOOGLE_CLIENT_ID="prod-google-client-id"
GOOGLE_CLIENT_SECRET="prod-google-client-secret"

# Production Security
NODE_ENV="production"
NEXTAUTH_DEBUG=false

# Production Logging
LOG_LEVEL="warn"
```

### Production with Vercel

```env
# Vercel-specific
VERCEL_URL="https://auth.example.com"
VERCEL_GIT_COMMIT_SHA="commit-hash"

# Vercel Environment
NEXT_PUBLIC_VERCEL_ENV="production"
```

## 🔧 Advanced Configuration

### Database Pooling

```env
# Database Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_IDLE_TIMEOUT=30000
```

### Rate Limiting

```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

### Session Configuration

```env
# Session Settings
SESSION_MAX_AGE=2592000
SESSION_UPDATE_AGE=86400
SESSION_COOKIE_NAME="__Secure-authjs.session-token"
```

### Email Configuration

```env
# Email Service (for password reset, etc.)
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@example.com"

# Resend Email Service
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@example.com"
```

### File Upload

```env
# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"
UPLOAD_DIR="./uploads"
```

## 🔒 Security Variables

### Encryption Keys

```env
# Encryption for sensitive data
ENCRYPTION_KEY="32-character-encryption-key-for-sensitive-data"

# JWT Signing Key (if using custom JWT)
JWT_SECRET="jwt-signing-secret-key"
```

### API Keys

```env
# External API Keys
EXTERNAL_API_KEY="your-external-api-key"
EXTERNAL_API_SECRET="your-external-api-secret"

# Analytics
ANALYTICS_ID="GA-XXXXXXXXXX"
```

### Monitoring

```env
# Error Tracking
SENTRY_DSN="https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxx"

# Performance Monitoring
DATADOG_API_KEY="your-datadog-api-key"
```

## 🌍 Environment-Specific Files

### Development (.env.local)

```env
# Development Environment
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/shadcn_template_dev"
AUTH_SECRET="dev-secret-key-for-local-development"
AUTH_URL="http://localhost:3000"
COOKIE_DOMAIN=".localhost"
ALLOWED_DOMAINS="localhost,auth.localhost,admin.localhost"
NEXTAUTH_DEBUG=true
```

### Staging (.env.staging)

```env
# Staging Environment
NODE_ENV=staging
DATABASE_URL="postgresql://staging-user:password@staging-db.example.com:5432/staging_db"
AUTH_SECRET="staging-secret-key"
AUTH_URL="https://staging-auth.example.com"
COOKIE_DOMAIN=".staging.example.com"
ALLOWED_DOMAINS="staging-auth.example.com,staging-admin.example.com"
```

### Production (.env.production)

```env
# Production Environment
NODE_ENV=production
DATABASE_URL="postgresql://prod-user:secure-password@prod-db.example.com:5432/prod_database"
AUTH_SECRET="production-32-character-super-secure-secret-key"
AUTH_URL="https://auth.example.com"
COOKIE_DOMAIN=".example.com"
ALLOWED_DOMAINS="auth.example.com,admin.example.com,dashboard.example.com"
NEXTAUTH_DEBUG=false
```

### Test (.env.test)

```env
# Test Environment
NODE_ENV=test
DATABASE_URL="postgresql://test:test@localhost:5432/shadcn_template_test"
AUTH_SECRET="test-secret-key-for-testing-only"
AUTH_URL="http://localhost:3000"
COOKIE_DOMAIN="localhost"
ALLOWED_DOMAINS="localhost"
```

## 🔄 Environment Variable Priority

Next.js loads environment variables in the following order:

1. `.env.local` (local overrides)
2. `.env.${NODE_ENV}` (environment-specific)
3. `.env` (default)

### Example Loading Order

```bash
# Development
.env.local > .env.development > .env

# Production
.env.local > .env.production > .env

# Test
.env.local > .env.test > .env
```

## 🛠️ Validation

### Environment Validation Script

```typescript
// lib/env.ts
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'AUTH_URL',
    'COOKIE_DOMAIN',
    'ALLOWED_DOMAINS'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate AUTH_SECRET length
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long');
  }
}
```

### TypeScript Types

```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string;
    
    // Authentication
    AUTH_SECRET: string;
    AUTH_URL: string;
    
    // Cross-Domain
    COOKIE_DOMAIN: string;
    ALLOWED_DOMAINS: string;
    
    // OAuth (optional)
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    
    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
    NEXTAUTH_DEBUG?: string;
  }
}
```

## 🔧 Setup Script

### Environment Setup Script

```bash
#!/bin/bash
# setup-env.sh

# Copy template
cp .env.example .env.local

# Generate AUTH_SECRET
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

# Prompt for database URL
read -p "Enter DATABASE_URL: " db_url
echo "DATABASE_URL=$db_url" >> .env.local

# Set development values
echo "NODE_ENV=development" >> .env.local
echo "AUTH_URL=http://localhost:3000" >> .env.local
echo "COOKIE_DOMAIN=.localhost" >> .env.local
echo "ALLOWED_DOMAINS=localhost,auth.localhost,admin.localhost" >> .env.local
echo "NEXTAUTH_DEBUG=true" >> .env.local

echo "Environment setup complete!"
```

## 🐛 Troubleshooting

### Common Issues

#### Missing Variables

```bash
# Check if all required variables are set
node -e "
  const required = ['DATABASE_URL', 'AUTH_SECRET', 'AUTH_URL'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing:', missing);
    process.exit(1);
  }
  console.log('All required variables present');
"
```

#### Invalid AUTH_SECRET

```bash
# Check AUTH_SECRET length
node -e "
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    console.error('AUTH_SECRET too short');
    process.exit(1);
  }
"
```

#### Cross-Domain Issues

- Ensure `COOKIE_DOMAIN` starts with `.` for subdomains
- Verify `ALLOWED_DOMAINS` includes all subdomains
- Check browser isn't blocking third-party cookies

### Debug Mode

Enable debug logging for environment variable issues:

```env
NEXTAUTH_DEBUG=true
DEBUG=next-auth:*
```

---

**Next**: [Permission System Documentation](../security/permissions.md) → Role-based access control implementation