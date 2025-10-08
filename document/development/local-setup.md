# Local Development Setup

Complete guide for setting up the development environment for the Next.js 15 + Auth.js v5 application.

## 🚀 Prerequisites

### Required Software

- **Node.js** 18.17 or later
- **npm** 9.x or later (or **yarn** 1.22+ / **pnpm** 8.x+)
- **PostgreSQL** 14+ (or compatible database)
- **Git** 2.30+

### Optional Tools

- **Docker** & **Docker Compose** (for containerized development)
- **VS Code** with recommended extensions
- **Postman** or **Insomnia** (for API testing)

## 📥 Installation

### 1. Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd shadcn-tempalte-1003

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Create database
createdb shadcn_template_dev

# Or via psql
psql postgres
CREATE DATABASE shadcn_template_dev;
\q
```

#### Option B: Docker (Recommended)

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# Or manually with Docker
docker run --name postgres-dev \
  -e POSTGRES_DB=shadcn_template_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C: Cloud Database

- **Supabase**, **Neon**, **Railway**, or other PostgreSQL providers
- Update `DATABASE_URL` in environment variables

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

#### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shadcn_template_dev"

# Authentication
AUTH_SECRET="your-32-character-super-secret-key-here"
AUTH_URL="http://localhost:3000"

# Cross-domain SSO (for development)
COOKIE_DOMAIN="localhost"
ALLOWED_DOMAINS="localhost,app.localhost,admin.localhost"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

#### Generate AUTH_SECRET

```bash
# Generate a secure secret
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Database Initialization

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
# or for production
npx prisma migrate deploy

# Seed database with initial data
npx prisma db seed
```

### 5. Development Server

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🔧 Development Workflow

### Database Operations

```bash
# View database schema
npx prisma studio

# Create new migration
npx prisma migrate dev --name add_feature_name

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/components/__tests__/LoginForm.test.tsx
```

## 🌐 Cross-Domain Development

### Local Subdomain Setup

For testing cross-domain SSO locally:

#### Option A: Hosts File (Recommended)

Edit `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 localhost
127.0.0.1 auth.localhost
127.0.0.1 admin.localhost
127.0.0.1 app.localhost
```

#### Option B: Local DNS

Use tools like `dnsmasq` or configure your local DNS server.

### Environment Variables for Cross-Domain

```env
# Development cross-domain configuration
COOKIE_DOMAIN=".localhost"
ALLOWED_DOMAINS="auth.localhost,admin.localhost,app.localhost"
AUTH_URL="http://auth.localhost:3000"
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection

```bash
# Check if PostgreSQL is running
psql -h localhost -U postgres -d shadcn_template_dev

# Reset database if needed
npx prisma migrate reset
```

#### Authentication Issues

- Verify `AUTH_SECRET` is 32 characters
- Check `COOKIE_DOMAIN` starts with `.` for subdomains
- Ensure `ALLOWED_DOMAINS` includes all subdomains

#### Cross-Domain Cookies

- Check browser isn't blocking third-party cookies
- Verify subdomains resolve to localhost
- Use same protocol (http/https) across all subdomains

#### Port Conflicts

```bash
# Check what's running on port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Debug Mode

Enable debug logging for troubleshooting:

```env
# Enable debug mode
NEXTAUTH_DEBUG=true
DEBUG=next-auth:*
```

## 🛠️ Development Tools

### VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Browser Extensions

- **React Developer Tools**
- **Redux DevTools** (if using Redux)
- **JSON Formatter**

### API Testing

```bash
# Install HTTP client
npm install -g httpie
# or
brew install httpie

# Test API endpoints
http GET http://localhost:3000/api/auth/session
```

## 📁 Project Structure

```
shadcn-tempalte-1003/
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                   # Utility libraries
├── prisma/                # Database schema
├── actions/               # Server actions
├── schemas/               # Validation schemas
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── public/                # Static assets
└── document/              # Documentation
```

## 🔄 Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🚀 Quick Start Commands

```bash
# Complete setup in one command
npm install && \
cp .env.example .env.local && \
npx prisma generate && \
npx prisma db push && \
npx prisma db seed && \
npm run dev
```

## 📚 Next Steps

After successful setup:

1. **Visit** `http://localhost:3000`
2. **Register** a new user account
3. **Explore** the admin dashboard (if you have admin role)
4. **Test** cross-domain functionality with subdomains
5. **Review** the API documentation for available endpoints

---

**Next**: [Environment Variables Configuration](./environment-variables.md) → Complete environment setup guide