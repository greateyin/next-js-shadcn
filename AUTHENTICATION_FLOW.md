# Authentication Flow Documentation

## Overview

This document describes the complete authentication flow for the application, including user registration, email verification, OAuth login, and password reset.

## User Registration Flow (Email + Password)

### Step 1: User Registration
- User submits registration form with email, password, and name
- **Action**: `registerAction()` in `actions/auth/registration.ts`
- **Process**:
  1. Validate input fields
  2. Check if email already exists
  3. Hash password using bcrypt
  4. Create new user in database with status = `pending`
  5. **✅ Assign default 'user' role immediately**
  6. Generate verification token
  7. Send verification email with token link

### Step 2: Email Verification
- User clicks verification link in email
- **Endpoint**: `GET /api/auth/verify?token=<token>`
- **Process**:
  1. Validate token exists and not expired
  2. Find user by email
  3. Update user status to `active`
  4. Mark email as verified
  5. **✅ Assign default 'user' role if not already assigned**
  6. Delete used verification token

### Result
- User status: `active` ✅
- User role: `user` ✅
- Email verified: `true` ✅
- User can now login with email/password

---

## OAuth Login Flow (Google / GitHub)

### Step 1: OAuth Provider Redirect
- User clicks "Login with Google" or "Login with GitHub"
- Auth.js redirects to OAuth provider

### Step 2: OAuth Callback
- OAuth provider redirects back with user data
- **Callback**: `signIn()` in `auth.config.ts`
- **Process**:
  1. Check if user exists in database
  2. If user doesn't exist, Auth.js creates new user via PrismaAdapter
  3. If user exists but has no roles:
     - Update user status to `active`
     - Mark email as verified (OAuth emails are pre-verified)
     - **✅ Assign default 'user' role**

### Result
- User status: `active` ✅
- User role: `user` ✅
- Email verified: `true` ✅
- User can immediately access the application

---

## Password Reset Flow

### Step 1: Request Password Reset
- User enters email on password reset page
- **Action**: `requestPasswordResetAction()` in `actions/auth/password-reset.ts`
- **Process**:
  1. Validate email format
  2. Check if user exists
  3. **✅ Allow both email/password users AND OAuth users**
  4. Generate password reset token
  5. Send password reset email with token link

### Step 2: Reset Password
- User clicks password reset link in email
- User enters new password
- **Action**: `newPasswordAction()` in `actions/auth/password-reset.ts`
- **Process**:
  1. Validate token exists and not expired
  2. Validate password format and strength
  3. Hash new password
  4. Update user password in database
  5. Delete used reset token
  6. Clear all user sessions (force re-login for security)

### Result
- User can now login with new password
- **✅ OAuth users can now also use email/password login**

---

## User Status States

| Status | Description | Can Login? | Email Verified? |
|--------|-------------|-----------|-----------------|
| `pending` | Email registration, awaiting verification | ❌ No | ❌ No |
| `active` | Verified email or OAuth user | ✅ Yes | ✅ Yes |
| `suspended` | Account suspended by admin | ❌ No | - |
| `banned` | Account banned by admin | ❌ No | - |
| `deleted` | Account deleted by user | ❌ No | - |

---

## User Roles

### Default Role Assignment

| Registration Method | Initial Role | When Assigned |
|-------------------|--------------|---------------|
| Email + Password | `user` | Immediately upon registration |
| OAuth (Google/GitHub) | `user` | Upon first OAuth login |
| Email Verification | `user` | When email is verified |

### Role Hierarchy

- **`user`** - Default role for all users
  - Can access: Dashboard, User Profile
  - Permissions: Basic read access

- **`admin`** - Administrator role
  - Can access: Admin Panel, Dashboard, User Profile
  - Permissions: Full CRUD on users, roles, applications, etc.

- **`super-admin`** - Super administrator role
  - Can access: All areas
  - Permissions: Full system access

---

## Security Considerations

### ✅ Implemented Security Measures

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Token Expiration**: Verification and reset tokens expire after 1 hour
3. **Token Deletion**: Used tokens are immediately deleted from database
4. **Session Clearing**: Password reset clears all user sessions
5. **Email Verification**: Email users must verify before accessing app
6. **OAuth Email Verification**: OAuth emails are automatically marked as verified
7. **Account Status Validation**: Suspended/banned accounts cannot login
8. **RBAC Enforcement**: All users must have at least one role
9. **Dangerous Email Linking Disabled**: OAuth account linking is disabled

### ⚠️ Important Notes

- OAuth users can optionally set a password via password reset
- This allows OAuth users to also login with email/password
- All users must have at least one role for RBAC enforcement
- If role assignment fails, user can still login but with no permissions

---

## Database Schema

### User Table
```
- id: String (Primary Key)
- email: String (Unique)
- name: String
- password: String (nullable - for OAuth users)
- status: UserStatus (pending | active | suspended | banned | deleted)
- emailVerified: DateTime (nullable)
- image: String (nullable)
- createdAt: DateTime
- updatedAt: DateTime
```

### UserRole Table (Join Table)
```
- userId: String (Foreign Key)
- roleId: String (Foreign Key)
- createdAt: DateTime
- updatedAt: DateTime
```

### Role Table
```
- id: String (Primary Key)
- name: String (Unique)
- description: String
- createdAt: DateTime
- updatedAt: DateTime
```

---

## Testing the Authentication Flow

### Test Email Registration
1. Go to `/auth/register`
2. Enter email, password, and name
3. Submit form
4. Check email for verification link
5. Click verification link
6. User should be able to login

### Test OAuth Login
1. Go to `/auth/login`
2. Click "Login with Google" or "Login with GitHub"
3. Complete OAuth flow
4. User should be immediately logged in

### Test Password Reset
1. Go to `/auth/reset-password`
2. Enter email
3. Check email for reset link
4. Click reset link
5. Enter new password
6. User should be able to login with new password

---

## Error Messages

### Login Error Messages

The login form now provides specific error messages to guide users:

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "User not found. Please register first." | Email doesn't exist in database | Click "Register here" link to create account |
| "Invalid password. Please try again." | Email exists but password is wrong | Try again or use "Forgot Password?" link |
| "Invalid credentials format" | Email or password format is invalid | Check email format and try again |
| "Authentication failed" | Auth.js callback error | Try again or contact support |
| "Something went wrong" | Unexpected error | Try again or contact support |

### User Not Found Flow

When a user tries to login with a non-existent email:

1. Login form displays: "User not found. Please register first."
2. A "Register here" link appears below the error message
3. User can click the link to go to registration page
4. User creates a new account

### Troubleshooting

#### User Cannot Login After Email Verification
- Check user status in database (should be `active`)
- Check if user has at least one role assigned
- Check if email is verified

#### OAuth User Cannot Reset Password
- This is now allowed! OAuth users can set a password via password reset
- After setting password, user can login with email/password

#### User Has No Roles
- This will prevent login
- Manually assign a role via admin panel or database
- Or re-verify email to trigger role assignment

#### User Sees "User not found" Error
- Email is not registered in the system
- Click "Register here" to create a new account
- Or check if you're using the correct email address

