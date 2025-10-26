# Dashboard Troubleshooting Guide

**Last Updated:** 2025-10-26  
**Version:** 1.0.0

---

## 🔧 Common Issues and Solutions

### Issue 1: "Failed to load dashboard statistics"

**Symptoms:**
- Dashboard shows error message
- Stats cards don't load
- Browser console shows fetch error

**Causes:**
1. API endpoint not responding
2. Database connection issue
3. Authentication problem
4. Prisma schema mismatch

**Solutions:**

#### Step 1: Check Authentication
```bash
# Verify you're logged in
# Check browser console for auth errors
# Verify session is valid
```

#### Step 2: Check API Endpoint
```bash
# Test the API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://auth.most.tw/api/dashboard/stats

# Should return JSON with stats
```

#### Step 3: Check Database Connection
```bash
# Verify database is running
# Check connection string in .env
# Verify Prisma client is initialized
```

#### Step 4: Check Prisma Schema
```bash
# Verify AuditLog model exists
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

#### Step 5: Check Server Logs
```bash
# Look for errors in Vercel logs
# Check for database query errors
# Look for authentication errors
```

---

### Issue 2: Search Not Working

**Symptoms:**
- Search bar doesn't show results
- Typing doesn't trigger search
- Results dropdown doesn't appear

**Causes:**
1. Search API not responding
2. Database query error
3. No matching results
4. Debounce delay too long

**Solutions:**

#### Step 1: Verify Search Query
```bash
# Test search API
curl "https://auth.most.tw/api/dashboard/search?q=dashboard"

# Should return results array
```

#### Step 2: Check Database Data
```bash
# Verify menu items exist
npx prisma studio

# Check MenuItem table has data
# Check displayName and description fields
```

#### Step 3: Check Search Debounce
```typescript
// In dashboard-nav.tsx, search debounce is 300ms
// If typing too fast, results may not appear
// Wait 300ms after typing stops
```

#### Step 4: Check Browser Console
```bash
# Look for fetch errors
# Check for CORS issues
# Look for JavaScript errors
```

---

### Issue 3: Notifications Not Showing

**Symptoms:**
- Bell icon shows no unread count
- Notification dropdown is empty
- Notifications page shows no data

**Causes:**
1. Notification system not initialized
2. No notifications in database
3. API endpoint error
4. Authentication issue

**Solutions:**

#### Step 1: Check Notification API
```bash
# Test notifications endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://auth.most.tw/api/notifications

# Should return notifications array
```

#### Step 2: Create Test Notification
```bash
# Use Prisma Studio to create test notification
npx prisma studio

# Create Notification record with:
# - userId: your user ID
# - type: "INFO"
# - title: "Test"
# - message: "Test notification"
```

#### Step 3: Check Notification Model
```bash
# Verify Notification model exists in schema
# Verify User relation is correct
# Verify indexes are created
```

#### Step 4: Check Auto-refresh
```typescript
// Notifications refresh every 30 seconds
// If no notifications, check:
// 1. Notification creation in database
// 2. User ID matches current user
// 3. API returns correct data
```

---

### Issue 4: Settings Page Not Loading

**Symptoms:**
- Settings page shows blank
- Tabs don't appear
- Form inputs missing

**Causes:**
1. Component not rendering
2. Missing dependencies
3. TypeScript error
4. CSS not loading

**Solutions:**

#### Step 1: Check Page File
```bash
# Verify file exists
ls -la app/dashboard/settings/page.tsx

# Should exist and be readable
```

#### Step 2: Check Component Import
```bash
# Verify component is imported correctly
# Check for typos in import path
# Verify component file exists
```

#### Step 3: Check Browser Console
```bash
# Look for JavaScript errors
# Check for missing CSS
# Look for React errors
```

#### Step 4: Rebuild Application
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Start dev server
npm run dev
```

---

### Issue 5: Help Page Not Loading

**Symptoms:**
- Help page shows blank
- FAQ doesn't expand
- Tabs don't work

**Causes:**
1. Component not rendering
2. Missing dependencies
3. State management issue
4. CSS not loading

**Solutions:**

#### Step 1: Check Page File
```bash
# Verify file exists
ls -la app/dashboard/help/page.tsx
```

#### Step 2: Check Component
```bash
# Verify DashboardHelpContent component exists
ls -la components/dashboard/dashboard-help-content.tsx
```

#### Step 3: Test FAQ Expansion
```typescript
// FAQ expansion uses state
// Click question to expand
// Should show answer below
```

#### Step 4: Check Tabs
```typescript
// Tabs use Tabs component from shadcn/ui
// Verify component is installed
// Check for CSS issues
```

---

### Issue 6: Admin Link Not Showing

**Symptoms:**
- Admin Panel link missing from sidebar
- Link shows for non-admin users
- Link doesn't navigate

**Causes:**
1. User doesn't have admin role
2. Role check not working
3. Session not loaded
4. Component not rendering

**Solutions:**

#### Step 1: Check User Roles
```bash
# Verify user has admin role
npx prisma studio

# Check UserRole table
# Verify role name is "admin"
```

#### Step 2: Check Session
```typescript
// In browser console
// Check session.user.roleNames
// Should include "admin" if user is admin
```

#### Step 3: Check Component
```typescript
// AdminPanelLink checks roleNames
// If empty, link won't show
// Verify session is loaded
```

#### Step 4: Verify Role Assignment
```bash
# Use Prisma Studio to assign admin role
# Create UserRole record with:
# - userId: your user ID
# - roleId: admin role ID
```

---

### Issue 7: Quick Actions Not Working

**Symptoms:**
- Quick Actions buttons don't navigate
- Links point to wrong pages
- Buttons don't respond

**Causes:**
1. Link path incorrect
2. Page doesn't exist
3. Navigation not working
4. Button not clickable

**Solutions:**

#### Step 1: Check Link Paths
```typescript
// Quick Actions should link to:
// - /dashboard/settings?tab=notifications
// - /dashboard/settings?tab=security
// - /dashboard/settings?tab=privacy
```

#### Step 2: Verify Pages Exist
```bash
# Check settings page exists
ls -la app/dashboard/settings/page.tsx

# Should exist
```

#### Step 3: Test Navigation
```bash
# Click Quick Action button
# Should navigate to settings page
# Tab parameter should work
```

#### Step 4: Check Browser Console
```bash
# Look for navigation errors
# Check for missing pages
# Look for JavaScript errors
```

---

## 🔍 Debugging Tips

### Enable Debug Logging
```typescript
// In API routes, add console.log
console.log('[API_DASHBOARD_STATS]', 'Fetching stats...')
console.log('[API_DASHBOARD_STATS]', stats)
```

### Check Network Requests
```bash
# Open browser DevTools
# Go to Network tab
# Look for API requests
# Check response status and data
```

### Check Database Queries
```bash
# Enable Prisma logging
export DEBUG="prisma:*"

# Run application
npm run dev
```

### Check Authentication
```typescript
// In browser console
// Check session
const session = await fetch('/api/auth/session').then(r => r.json())
console.log(session)
```

---

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**
   - Browser console (F12)
   - Vercel deployment logs
   - Server logs

2. **Check the documentation**
   - DASHBOARD_COMPLETION_REPORT.md
   - DASHBOARD_IMPLEMENTATION_GUIDE.md
   - API documentation

3. **Verify the setup**
   - Database connection
   - Environment variables
   - Prisma schema
   - Authentication

4. **Test the API**
   - Use curl or Postman
   - Test endpoints directly
   - Check response data

5. **Contact support**
   - Check /dashboard/help
   - Use support contact options
   - Email support team

---

## ✅ Verification Checklist

- [ ] Database is running
- [ ] Prisma schema is up to date
- [ ] User is authenticated
- [ ] User has correct roles
- [ ] API endpoints are accessible
- [ ] Browser console has no errors
- [ ] Network requests are successful
- [ ] Data is loading correctly
- [ ] All pages are accessible
- [ ] All features are working

---

## 🚀 Quick Fix Commands

```bash
# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Clear Next.js cache
rm -rf .next

# Rebuild application
npm run build

# Start dev server
npm run dev

# Check database
npx prisma studio
```

---

**Last Updated:** 2025-10-26

