# Login Issue Diagnosis Report

**Date:** 2025-10-26  
**Issue:** Login stops at `https://auth.most.tw/auth/login?callbackUrl=%2Fadmin` after entering credentials  
**Status:** 🔍 INVESTIGATING

---

## Problem Description

When logging in with `admin@example.com`:
1. User enters credentials
2. POST /auth/login returns 200 (success)
3. Browser redirects to `https://auth.most.tw/auth/login?callbackUrl=%2Fadmin`
4. **Login stops and doesn't proceed to /admin**

Error logs show stack traces in `/var/task/.next/server/chunks/9124.js` but no clear error message.

---

## Root Cause Analysis

### Hypothesis 1: User Has No Roles ❌

**Evidence:**
- Recent changes added role verification in JWT callback
- If user has no roles, JWT callback returns empty RBAC data
- This causes authorization to fail

**Code Path:**
```typescript
// auth.config.ts - JWT callback
if (!userRolesAndPermissions.roles || userRolesAndPermissions.roles.length === 0) {
  console.warn(`User has no active roles - denying token issuance`);
  token.roleNames = [];
  token.permissionNames = [];
  token.applicationPaths = [];
  token.role = undefined;
  return token;
}
```

**Impact:**
- User gets token with empty roles
- Downstream authorization checks fail
- User cannot access /admin

### Hypothesis 2: Role Lookup Fails ❌

**Evidence:**
- `getUserRolesAndPermissions` might throw an error
- Error is caught and logged, but token is returned with empty RBAC data

**Code Path:**
```typescript
catch (error) {
  console.error("Error getting user roles - denying access with empty RBAC:", error);
  token.roleNames = [];
  token.permissionNames = [];
  token.applicationPaths = [];
  token.role = undefined;
}
```

**Impact:**
- Same as Hypothesis 1

### Hypothesis 3: New Role Check in Authorize ❌

**Evidence:**
- Just added role check in authorize callback
- If user has no roles, authorize returns null
- Login fails silently

**Code Path:**
```typescript
// auth.config.ts - authorize callback
const userRoles = await db.userRole.findFirst({
  where: { userId: user.id }
});

if (!userRoles) {
  console.warn("User has no roles assigned - login denied");
  return null;
}
```

**Impact:**
- Login fails at authorize stage
- User is redirected back to login page

---

## Fixes Applied

### Fix 1: Added Role Check in Authorize Callback ✅

**File:** `auth.config.ts` (lines 123-141)

```typescript
// ⚠️ SECURITY: Check if user has at least one role
try {
  const userRoles = await db.userRole.findFirst({
    where: { userId: user.id }
  });

  if (!userRoles) {
    console.warn("User has no roles assigned - login denied");
    return null;
  }
} catch (error) {
  console.error("Error checking user roles during login:", error);
  return null;
}
```

**Purpose:**
- Ensure users without roles cannot log in
- Fail securely if role verification fails

### Fix 2: Improved Error Logging in JWT Callback ✅

**File:** `auth.config.ts` (line 296)

```typescript
const errorMessage = error instanceof Error ? error.message : String(error);
console.error("Error getting user roles - denying access with empty RBAC:", errorMessage);
```

**Purpose:**
- Better error messages for debugging
- Helps identify what went wrong

---

## Verification Steps

### Step 1: Check admin@example.com User Status

Run the SQL queries in `check-admin-user.sql`:

```sql
-- Check if admin@example.com has roles
SELECT 
    u.email,
    u.status,
    COUNT(ur.id) as role_count,
    STRING_AGG(r.name, ', ') as roles
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'admin@example.com'
GROUP BY u.id, u.email, u.status;
```

**Expected Result:**
- `role_count` should be > 0
- `roles` should contain 'admin' or 'user'

**If Result is 0:**
- User has no roles
- Need to assign roles manually

### Step 2: Assign Roles if Missing

If admin@example.com has no roles, run:

```sql
INSERT INTO "UserRole" ("userId", "roleId", "createdAt", "updatedAt")
SELECT 
    (SELECT id FROM "User" WHERE email = 'admin@example.com'),
    (SELECT id FROM "Role" WHERE name = 'admin'),
    NOW(),
    NOW()
ON CONFLICT DO NOTHING;
```

### Step 3: Test Login

1. Clear browser cache/cookies
2. Visit https://auth.most.tw/auth/login
3. Enter admin@example.com credentials
4. Verify login succeeds and redirects to /admin

---

## Expected Behavior After Fix

### Scenario 1: User Has Roles ✅

```
1. User enters credentials
   ↓
2. authorize() checks if user has roles → YES
   ↓
3. JWT callback gets roles from database
   ↓
4. Token is issued with role data
   ↓
5. Session is created with roles
   ↓
6. User is redirected to /admin
   ↓
7. Admin layout checks roles → HAS ADMIN ROLE
   ↓
8. Admin page loads successfully
```

### Scenario 2: User Has No Roles ❌

```
1. User enters credentials
   ↓
2. authorize() checks if user has roles → NO
   ↓
3. authorize() returns null
   ↓
4. Login fails
   ↓
5. User is redirected to /auth/login
   ↓
6. Error message shown (if implemented)
```

---

## Next Steps

1. **Run SQL queries** to check admin@example.com role status
2. **Assign roles** if missing
3. **Test login** with admin@example.com
4. **Monitor logs** for any errors
5. **Test with other users** (if available)

---

## Files Modified

- `auth.config.ts` - Added role check in authorize callback
- `check-admin-user.sql` - Diagnostic SQL queries
- `LOGIN_ISSUE_DIAGNOSIS.md` - This report

---

**Last Updated:** 2025-10-26

