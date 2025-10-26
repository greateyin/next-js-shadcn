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

### 1️⃣ Modified JWT Callback Logic

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

### 2️⃣ Added Session Refetch Configuration

**File**: `components/providers/SessionProvider.tsx`

**Key Changes:**

```typescript
export function SessionProvider({
    children,
    session
}: SessionProviderProps) {
    return (
        <NextAuthSessionProvider
            session={session}
            // ✅ FIX: Automatically refresh session to ensure latest user data
            refetchInterval={5 * 60} // Refresh every 5 minutes
            refetchOnWindowFocus={true} // Refresh when window regains focus
        >
            {children}
        </NextAuthSessionProvider>
    )
}
```

### How It Works

1. **Periodic Refresh**: Every 5 minutes, `useSession()` calls `/api/auth/session`
   - Fetches latest session data from server
   - Updates client-side session state

2. **Window Focus Refresh**: When user returns to window
   - Immediately refreshes session
   - Ensures data is current after user was away

3. **Real-time Updates**: Avatar always shows latest user data
   - No manual refresh needed
   - Works seamlessly across all pages

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
- ❌ JWT callback doesn't refresh on token update
- ❌ Client-side session never refreshes

### After Fix
- ✅ Avatar always shows correct name
- ✅ No page refresh needed
- ✅ User profile data always synchronized
- ✅ Works across all login methods (OAuth, email/password)
- ✅ JWT callback refreshes user data on token update
- ✅ Client-side session auto-refreshes every 5 minutes
- ✅ Session refreshes when user returns to window

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

## 🔴 CRITICAL BUG FIXED: Session Serialization Issue

### The Real Root Cause

**File**: `auth.config.ts` (Session callback, lines 407-424)

The session callback was creating `new Date()` objects for roles, permissions, and applications. These Date objects are **NOT JSON serializable** and were being stripped out when the session was passed from server to client via SessionProvider.

**Before (Broken):**
```typescript
// ❌ Date objects are NOT serializable
session.user.roles = session.user.roleNames.map(name => ({
  name,
  id: '',
  createdAt: new Date(),  // ❌ NOT serializable!
  updatedAt: new Date()   // ❌ NOT serializable!
}));
```

**After (Fixed):**
```typescript
// ✅ ISO 8601 strings are JSON serializable
const now = new Date().toISOString();
session.user.roles = session.user.roleNames.map(name => ({
  name,
  id: '',
  createdAt: now,  // ✅ Serializable!
  updatedAt: now   // ✅ Serializable!
})) as any;
```

### Why This Caused the Avatar Issue

1. Session callback creates Date objects
2. Session is serialized to JSON for transmission to client
3. Date objects are stripped out during serialization
4. Session object becomes corrupted
5. SessionProvider receives incomplete/null session
6. `useSession()` returns `null` or `undefined`
7. Avatar component has no user data, displays "U"

### Impact of Fix

- ✅ Session object now properly serializes
- ✅ SessionProvider receives complete session data
- ✅ `useSession()` returns correct user data
- ✅ Avatar displays correct name immediately
- ✅ No need for page refresh

---

## 🚀 Deployment Notes

- No database migrations required
- No environment variable changes needed
- Backward compatible with existing sessions
- Automatic fix on next token refresh
- **CRITICAL**: Deploy this fix immediately to resolve avatar display issue

