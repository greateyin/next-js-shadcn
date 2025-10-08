# Quick Start Guide

Get your Next.js 15 + Auth.js v5 application running in 5 minutes.

---

## 🚀 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20+ (recommended: 22+)
- **PostgreSQL** 17+ (recommended: 17+)
- **pnpm** (recommended) or npm/yarn

---

## ⚡ 5-Minute Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/shadcn-template-1003.git
cd shadcn-template-1003

# Install dependencies with pnpm (recommended)
pnpm install

# Or with npm
npm install

# Or with yarn
yarn install
```

### Step 2: Configure Environment Variables

```bash
# Copy the environment template
cp .env.example .env.local

# Edit the configuration
nano .env.local  # or use your preferred editor
```

**Minimal `.env.local` configuration:**

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/shadcn_template"

# Authentication Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-super-secret-key-minimum-32-characters-long"

# Cross-Domain SSO Configuration (for local development)
COOKIE_DOMAIN=.lvh.me
ALLOWED_DOMAINS=auth.lvh.me,admin.lvh.me,dashboard.lvh.me
AUTH_URL=http://auth.lvh.me:3000

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 3: Initialize Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Create database schema
pnpm prisma:sync

# Seed with initial data (creates test accounts)
pnpm prisma:seed
```

### Step 4: Start Development Server

```bash
# Start on default port 3000
pnpm dev

# Or specify a custom port
pnpm dev -- -p 3001
```

### Step 5: Test the Application

Open these URLs in your browser to test cross-domain SSO:

1. **Admin Dashboard**: http://admin.lvh.me:3000/admin
2. **User Dashboard**: http://dashboard.lvh.me:3000/dashboard
3. **Authentication Center**: http://auth.lvh.me:3000/auth/login

**SSO Flow Test:**
1. Visit `admin.lvh.me:3000/admin` → Redirects to login
2. Login at `auth.lvh.me:3000/auth/login`
3. Automatically redirected back to admin dashboard
4. Visit `dashboard.lvh.me:3000/dashboard` → Already logged in! ✅

---

## 🧪 Test Accounts

After running the seed script, these test accounts are available:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@example.com` | `Admin123!` | Full system access |
| **User** | `user@example.com` | `User123!` | Standard user access |

---

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm dev -- -p 3000   # Start on specific port

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript type checking

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report

# Database Operations
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:sync      # Sync database schema (dev only)
pnpm prisma:migrate   # Create and run migrations
pnpm prisma:seed      # Seed database with test data
pnpm prisma:studio    # Open Prisma Studio (database GUI)
```

---

## 🌐 Local Development with Subdomains

### Option 1: Using lvh.me (Recommended - No Configuration Needed)

`lvh.me` is a free service that resolves to `127.0.0.1`. Use these subdomains:

- `http://auth.lvh.me:3000` - Authentication center
- `http://admin.lvh.me:3000` - Admin dashboard
- `http://dashboard.lvh.me:3000` - User dashboard

**No hosts file configuration required!**

### Option 2: Custom Local Domains

Add to `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 auth.localhost admin.localhost dashboard.localhost
```

Update `.env.local`:

```env
COOKIE_DOMAIN=.localhost
ALLOWED_DOMAINS=auth.localhost,admin.localhost,dashboard.localhost
AUTH_URL=http://auth.localhost:3000
```

---

## 🎯 Next Steps

After successful setup, explore these areas:

1. **[Installation Guide](./installation.md)** - Detailed installation and configuration
2. **[Local Development](./local-development.md)** - Development environment best practices
3. **[Authentication Guide](../guides/authentication/README.md)** - Learn about the auth system
4. **[Admin UI Guide](../guides/admin-ui/README.md)** - Explore the admin interface
5. **[API Documentation](../api/overview.md)** - Available API endpoints

---

## 🐛 Troubleshooting

### Database Connection Error

**Problem**: Cannot connect to PostgreSQL

**Solutions**:
- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format is correct
- Ensure database exists: `createdb shadcn_template`
- Verify credentials are correct

### Authentication Issues

**Problem**: Cannot login or session not persisting

**Solutions**:
- Verify `AUTH_SECRET` is set (minimum 32 characters)
- Check `COOKIE_DOMAIN` configuration (must start with `.`)
- Ensure all subdomains use the same port
- Clear browser cookies and try again

### Cross-Domain Cookie Issues

**Problem**: Not staying logged in across subdomains

**Solutions**:
- Verify `COOKIE_DOMAIN` starts with `.` (e.g., `.lvh.me`)
- Check `ALLOWED_DOMAINS` includes all subdomains
- Ensure browser isn't blocking third-party cookies
- Test in incognito/private mode to rule out extensions

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solutions**:
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
pnpm dev -- -p 3001

# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### OAuth Provider Errors

**Problem**: Google/GitHub OAuth not working

**Solutions**:
- Verify OAuth credentials are correct in `.env.local`
- Check OAuth redirect URIs in provider console
- Ensure provider credentials are not expired
- Check console for specific error messages

---

## 📊 Verify Installation

Run these commands to verify everything is set up correctly:

```bash
# Check Node.js version
node --version  # Should be 20+

# Check pnpm version
pnpm --version  # Should be 9+

# Check PostgreSQL connection
pnpm prisma db pull

# Check TypeScript compilation
pnpm type-check

# Run tests
pnpm test
```

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change `AUTH_SECRET` to a strong random value
- [ ] Update OAuth redirect URIs to production domains
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (required for production)
- [ ] Configure proper `COOKIE_DOMAIN` for production
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review and update CORS settings
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts

---

## 📚 Additional Resources

- **[Installation Guide](./installation.md)** - Detailed setup instructions
- **[Local Development](./local-development.md)** - Development best practices
- **[Environment Configuration](../deployment/environment.md)** - All environment variables
- **[System Architecture](../architecture/system-design.md)** - How everything fits together

---

**Ready to dive deeper?** → [Installation Guide](./installation.md)

**Need help?** → Open an issue on GitHub or check our [Troubleshooting Guide](../guides/troubleshooting.md)
