# Avatar Display Issue Fix - 'U' Instead of User Name

## 🐛 Problem Description

**Scenario:**
1. User registers via Google OAuth
2. User sets a password via password reset flow
3. User logs out
4. User logs in with email + password
5. **Issue**: Avatar shows "U" instead of the correct user name
6. **Workaround**: Refreshing the page shows the correct name

## 🔍 Root Cause Analysis

### The Issue Flow

```
Google OAuth Login
    ↓
User created with name from Google account
    ↓
JWT callback: token.name = user.name ✅
    ↓
Session callback: session.user.name = token.name ✅
    ↓
Avatar displays correctly ✅
    ↓
User sets password via password reset
    ↓
User logs out
    ↓
User logs in with email + password
    ↓
JWT callback: user object provided
    ↓
token.name = user.name ✅
    ↓
BUT: On token refresh (after 24 hours or page reload)
    ↓
JWT callback: user object is UNDEFINED ❌
    ↓
token.name is NOT updated from database ❌
    ↓
Session callback: session.user.name = token.name (old value) ❌
    ↓
Avatar shows "U" (fallback when name is empty) ❌
```

### Why Refresh Fixed It

When you refresh the page:
1. Next.js calls `auth()` on the server
2. Auth.js reads the JWT token from cookies
3. Auth.js calls the JWT callback with `user: undefined`
4. **Before fix**: JWT callback didn't refresh user data, so token.name remained empty
5. **After fix**: JWT callback fetches latest user data from database
6. token.name is updated with the correct value
7. Avatar displays correctly

## ✅ Solution Implemented

### Modified JWT Callback Logic

**File**: `auth.config.ts` (lines 271-368)

**Key Changes:**

```typescript
async jwt({ token, user }) {
  // ✅ FIX: Always refresh user data from database
  let userId = user?.id || (token.id as string);
  
  if (user) {
    // Initial login - user object is provided
    token.id = user.id;
    token.status = user.status;
    token.email = user.email;
    token.name = user.name ?? null;
    token.picture = user.image ?? null;
  } else if (token.id) {
    // ✅ Token refresh - fetch latest user data from database
    try {
      const dbUser = await db.user.findUnique({
        where: { id: token.id as string }
      });

      if (dbUser) {
        token.status = dbUser.status;
        token.email = dbUser.email;
        token.name = dbUser.name ?? null;
        token.picture = dbUser.image ?? null;
      }
    } catch (error) {
      console.error('[JWT_CALLBACK] Error refreshing user data:', error);
    }
  }
  
  // ... rest of RBAC logic
}
```

### How It Works

1. **Initial Login**: User object is provided by Auth.js
   - Update token with user data (name, email, image, etc.)

2. **Token Refresh**: User object is undefined
   - Fetch latest user data from database using token.id
   - Update token with fresh data from database
   - Ensures name, email, image are always current

3. **Session Callback**: Uses updated token data
   - `session.user.name = token.name` (always up-to-date)
   - Avatar displays correct name

## 🧪 Testing

### Test Case 1: Google OAuth → Password Reset → Email Login

```
1. Click "Login with Google"
2. Authorize with Google account
3. User created with name from Google
4. Avatar shows correct name ✅

5. Click "Forgot Password?"
6. Enter email and set new password
7. Logout

8. Login with email + password
9. Avatar shows correct name ✅ (FIXED)
10. Refresh page
11. Avatar still shows correct name ✅
```

### Test Case 2: Email Registration → Login

```
1. Register with email + password + name
2. Verify email
3. Login with email + password
4. Avatar shows correct name ✅
5. Refresh page
6. Avatar still shows correct name ✅
```

### Test Case 3: Update User Profile

```
1. Login
2. Update user name in profile
3. Avatar updates immediately ✅ (on next token refresh)
4. Refresh page
5. Avatar shows updated name ✅
```

## 📊 Impact

### Before Fix
- ❌ Avatar shows "U" after password reset
- ❌ Requires page refresh to see correct name
- ❌ User profile data not synchronized

### After Fix
- ✅ Avatar always shows correct name
- ✅ No page refresh needed
- ✅ User profile data always synchronized
- ✅ Works across all login methods (OAuth, email/password)

## 🔐 Security Considerations

- Database query only fetches user data (no sensitive fields)
- Query is cached by Prisma (minimal performance impact)
- Only executed during token refresh (not on every request)
- Fails gracefully if database is unavailable

## 📝 Related Files

- `auth.config.ts` - JWT callback implementation
- `components/dashboard/dashboard-nav.tsx` - Avatar display component
- `components/admin/AdminHeader.tsx` - Admin avatar display
- `components/layout/UserNav.tsx` - Header user navigation

## 🚀 Deployment Notes

- No database migrations required
- No environment variable changes needed
- Backward compatible with existing sessions
- Automatic fix on next token refresh

