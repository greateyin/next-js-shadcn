# Quick Start Guide

Get your Next.js 15 + Auth.js v5 + Centralized SSO application running in 5 minutes.

## 🚀 5-Minute Setup

### Prerequisites

- **Node.js** 20+ (recommended: 22+)
- **PostgreSQL** 17+ (recommended: 17+)
- **pnpm** (recommended) or npm

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/shadcn-template-1003.git
cd shadcn-template-1003

# Install dependencies
pnpm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

**Minimal `.env.local` configuration:**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shadcn_template"

# Authentication
AUTH_SECRET="your-super-secret-key-minimum-32-characters-long"

# Cross-domain SSO (local development)
COOKIE_DOMAIN=.lvh.me
ALLOWED_DOMAINS=auth.lvh.me,admin.lvh.me,dashboard.lvh.me
AUTH_URL=http://auth.lvh.me:3000

# Optional OAuth providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 3: Database Setup

```bash
# Generate Prisma client
pnpm prisma:generate

# Create database schema
pnpm prisma:sync

# Seed with initial data
pnpm prisma:seed
```

### Step 4: Start Development Server

```bash
# Start development server on port 3000
pnpm dev -- -p 3000
```

### Step 5: Test the Application

Open multiple browser tabs to test cross-domain SSO:

1. **Admin Dashboard**: http://admin.lvh.me:3000/admin
2. **User Dashboard**: http://dashboard.lvh.me:3000/dashboard
3. **Authentication Center**: http://auth.lvh.me:3000/auth/login

**Test SSO Flow:**
- Visit `admin.lvh.me:3000/admin` → Redirects to login
- Login at `auth.lvh.me:3000/auth/login`
- Automatically redirected back to admin dashboard
- Visit `dashboard.lvh.me:3000/dashboard` → Already logged in! ✅

## 🧪 Test Accounts

After running the seed script, you'll have these test accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | `admin@example.com` | `Admin123` | Full system access |
| User | `user@example.com` | `User123` | Standard user access |

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm dev -- -p 3000   # Start on specific port

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript type checking

# Testing
pnpm test             # Run Jest tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:sync      # Sync database schema
pnpm prisma:seed      # Seed database with test data
```

## 🌐 Local Development with Subdomains

### Using lvh.me (No Hosts File Required)

The project uses `lvh.me` (localhost virtual host) for local development, which resolves to `127.0.0.1`:

- `auth.lvh.me:3000` - Authentication center
- `admin.lvh.me:3000` - Admin dashboard
- `dashboard.lvh.me:3000` - User dashboard

### Alternative: Configure /etc/hosts

If you prefer custom domains, add to `/etc/hosts`:

```
127.0.0.1 auth.localhost admin.localhost dashboard.localhost
```

Then update your `.env.local`:

```env
COOKIE_DOMAIN=.localhost
ALLOWED_DOMAINS=auth.localhost,admin.localhost,dashboard.localhost
AUTH_URL=http://auth.localhost:3000
```

## 🎯 Next Steps

After successful setup:

1. **Explore the Admin Dashboard** - Manage users, roles, permissions, and applications
2. **Review Authentication Flow** - Test different login methods (email/password, OAuth)
3. **Check Cross-Domain SSO** - Verify single sign-on across subdomains
4. **Customize Components** - Modify shadcn/ui components to match your design
5. **Configure Permissions** - Set up role-based access control for your use case

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists

**Authentication Issues**
- Verify `AUTH_SECRET` is set (32+ characters)
- Check `COOKIE_DOMAIN` and `ALLOWED_DOMAINS`
- Ensure all subdomains use same port

**Cross-Domain Cookie Issues**
- Verify `COOKIE_DOMAIN` starts with `.` (e.g., `.lvh.me`)
- Check browser isn't blocking third-party cookies
- Test in incognito/private mode

**Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
pnpm dev -- -p 3001
```

## 📚 Additional Resources

- [Local Development Setup](./local-development.md) - Detailed local environment configuration
- [Environment Variables](./environment-variables.md) - Complete environment configuration guide
- [System Architecture](./architecture/system-architecture.md) - Understand the overall design
- [Authentication System](./security/authentication.md) - Learn about Auth.js v5 implementation

---

**Next**: [Local Development Setup](./local-development.md) → Detailed configuration for development environment