# 🚀 Deploy Fix for __dirname Error

## ✅ Changes Applied

### 1. `next.config.js`
- ✅ Added `serverComponentsExternalPackages` to exclude CommonJS packages
- ✅ Added Edge Runtime webpack aliases to prevent bundling winston/editorconfig
- ✅ Updated client-side null-loader to exclude additional packages

### 2. `middleware.ts`
- ✅ Explicitly set `runtime: 'edge'` in config

### 3. Documentation
- ✅ Created `document/VERCEL_EDGE_RUNTIME_FIX.md` with full explanation

## 📋 Deployment Steps

### Step 1: Clean Build (Optional but Recommended)
```bash
rm -rf .next
pnpm build
```

### Step 2: Test Locally
```bash
pnpm dev
# Visit http://localhost:3000 and test:
# - Homepage
# - Login/Logout
# - Protected routes
```

### Step 3: Commit Changes
```bash
git add next.config.js middleware.ts document/VERCEL_EDGE_RUNTIME_FIX.md DEPLOY_FIX.md
git commit -m "fix: resolve __dirname error in Vercel Edge Runtime

- Add serverComponentsExternalPackages for winston and editorconfig
- Configure webpack to exclude CommonJS packages from Edge Runtime
- Explicitly set middleware runtime to 'edge'
- Prevent @one-ini/wasm from being bundled

Fixes ReferenceError: __dirname is not defined in production"
```

### Step 4: Push to Vercel
```bash
git push origin main
```

### Step 5: Monitor Deployment
1. Go to Vercel Dashboard
2. Wait for deployment to complete
3. Check the logs for any errors
4. Test your production URL

## 🔍 What to Check After Deployment

### ✅ Should Work:
- [ ] Homepage loads (no 500 error)
- [ ] `/favicon.ico` loads
- [ ] Login redirects work
- [ ] Protected routes redirect to login when not authenticated
- [ ] Admin routes check permissions correctly
- [ ] No `__dirname` errors in Vercel Function Logs

### ❌ If Still Failing:
1. Check Vercel Function Logs for the specific error
2. Verify all environment variables are set correctly
3. Ensure `next-auth` environment variables are present:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - OAuth credentials (Google, GitHub)

## 🛠 Root Cause Explained

**Problem**: Vercel runs Next.js middleware in Edge Runtime (ES Modules), but some packages use CommonJS globals like `__dirname`.

**Culprits**:
- `@one-ini/wasm` (used by `editorconfig`)
- `winston` and `winston-elasticsearch` (server logging)

**Solution**: Configured Next.js to:
1. Exclude these packages from Edge Runtime bundling
2. Use universal logger (console-based) in middleware
3. Keep winston for server-side API routes only

## 📚 References

- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Auth.js with Edge Runtime](https://authjs.dev/getting-started/deployment#edge-runtime)
