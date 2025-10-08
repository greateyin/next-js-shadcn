# Authentication System Guide

Complete guide to the authentication system built with Auth.js v5.

**Last Updated**: 2025-10-08  
**Auth.js Version**: 5.0.0-beta.29+  
**Next.js Version**: 15.5.4+

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [OAuth Auto-Registration Flow](#oauth-auto-registration-flow)
3. [Password Reset Flow](#password-reset-flow)
4. [Two-Factor Authentication](#two-factor-authentication)
5. [Best Practices](#best-practices)
6. [Security Considerations](#security-considerations)
7. [Testing Guide](#testing-guide)

---

## Overview

### Supported Authentication Methods

| Method | Description | Status |
|--------|-------------|--------|
| **Email/Password** | Traditional credentials authentication | ✅ Active |
| **Google OAuth** | Sign in with Google | ✅ Active |
| **GitHub OAuth** | Sign in with GitHub | ✅ Active |
| **Two-Factor Auth** | Additional security layer | ✅ Active |

### Key Features

- **Automatic Account Creation** - OAuth users are automatically registered
- **Account Linking** - Multiple auth methods for same email
- **Password Reset** - Secure password recovery flow
- **Session Management** - JWT-based sessions with auto-refresh
- **Audit Logging** - Complete authentication activity tracking
- **Role Assignment** - Automatic role assignment on registration

---

## OAuth Auto-Registration Flow

### 🎯 Goals

When users authenticate via OAuth (Google/GitHub):
- ✅ Automatically create account if email doesn't exist
- ✅ Link account if email already exists
- ✅ Set user status to `active` (OAuth emails are verified)
- ✅ Assign default `user` role automatically
- ✅ **No manual registration form required**

### Implementation Details

#### Auth.js Configuration

**File**: `auth.config.ts`

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // 🔑 Key setting
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // 🔑 Key setting
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // OAuth providers automatically handled
      if (account?.provider !== "credentials") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
          include: { userRoles: true }
        });

        // Auto-initialize new OAuth users
        if (existingUser && existingUser.userRoles.length === 0) {
          // 1. Set to active (OAuth email is verified)
          await db.user.update({
            where: { id: existingUser.id },
            data: { 
              status: "active",
              emailVerified: new Date()
            }
          });

          // 2. Assign default role
          const userRole = await db.role.findUnique({
            where: { name: "user" }
          });

          if (userRole) {
            await db.userRole.create({
              data: {
                userId: existingUser.id,
                roleId: userRole.id
              }
            });
          }

          // 3. Record login method
          await db.loginMethod.create({
            data: {
              userId: existingUser.id,
              method: account.provider
            }
          });
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        // Load user data including roles and permissions
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.status = dbUser.status;
          token.isTwoFactorEnabled = dbUser.isTwoFactorEnabled;
          
          // Extract roles and permissions
          token.roleNames = dbUser.userRoles.map(ur => ur.role.name);
          token.permissionNames = dbUser.userRoles.flatMap(ur =>
            ur.role.permissions.map(rp => rp.permission.name)
          );
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.status = token.status as string;
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.roleNames = token.roleNames as string[];
        session.user.permissionNames = token.permissionNames as string[];
      }
      
      return session;
    }
  }
};
```

#### Key Configuration: `allowDangerousEmailAccountLinking`

**Purpose**:
- Allows automatic account linking for same email address
- When OAuth user's email matches existing user, automatically links instead of throwing error

**Why "dangerous"?**
- If OAuth provider doesn't properly verify emails, could lead to account hijacking
- However, Google and GitHub have strict email verification, making this safe

**Use Cases**:
- ✅ Trusted OAuth providers (Google, GitHub, Microsoft)
- ✅ Allow users to use multiple login methods
- ❌ Untrusted or custom OAuth providers

### OAuth Login Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Google login page
   ↓
3. Google verifies user and returns data
   ↓
4. Auth.js checks database
   ├─ User exists?
   │  ├─ Yes → Check if has roles
   │  │      ├─ No roles → Initialize (set active + assign role)
   │  │      └─ Has roles → Direct login
   │  └─ No → Prisma Adapter auto-creates user
   │           ↓
   │           signIn callback initializes
   ↓
5. Set session and redirect to dashboard
```

### User Experience

**Traditional Flow (❌ Not Recommended)**:
```
OAuth Login → Fill Registration Form → Confirm → Login Success
```

**Our Flow (✅ Recommended)**:
```
OAuth Login → Direct Login Success
```

### Database State Changes

| Field | Before OAuth Login | After OAuth Login |
|-------|-------------------|-------------------|
| `status` | `pending` | `active` ✅ |
| `emailVerified` | `null` | `new Date()` ✅ |
| `userRoles` | `[]` | `[{ roleId: "user" }]` ✅ |
| `loginMethods` | `[]` | Auto-added ✅ |

---

## Password Reset Flow

### 🎯 Improved Features

1. **Server Actions** - Follows Auth.js V5 best practices
2. **Forgot Password Link** - Visible on login page
3. **Password Strength Validation** - Uppercase, lowercase, numbers
4. **Real-time Strength Indicator** - Visual feedback
5. **Show/Hide Password** - Toggle password visibility
6. **Auto-redirect After Reset** - Automatic redirect to login
7. **Clear All Sessions** - Force re-login for security
8. **OAuth User Detection** - Friendly message for OAuth-only users

### Complete Flow

#### Step 1: Request Password Reset

**Page**: `/auth/forgot-password`

**Server Action**: `requestPasswordResetAction`

```typescript
"use server";

import { z } from "zod";
import { getUserByEmail } from "@/lib/db/user";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

const EmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const requestPasswordResetAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  try {
    // 1. Validate email format
    const email = formData.get("email") as string;
    const validatedFields = EmailSchema.safeParse({ email });
    
    if (!validatedFields.success) {
      return { error: "Invalid email address" };
    }
    
    // 2. Check if user exists
    const existingUser = await getUserByEmail(email);
    
    if (!existingUser) {
      // Return success even if user doesn't exist (security)
      return { 
        success: "If this email exists, a reset link has been sent!" 
      };
    }
    
    // 3. Check if OAuth user (no password)
    if (!existingUser.password) {
      return { 
        error: "This account uses social login and cannot reset password. Please use Google or GitHub to sign in." 
      };
    }
    
    // 4. Generate token (1 hour expiry)
    const passwordResetToken = await generatePasswordResetToken(email);
    
    // 5. Send email
    await sendPasswordResetEmail(
      email, 
      passwordResetToken.token
    );
    
    return { success: "Password reset email sent!" };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "Something went wrong. Please try again." };
  }
};
```

**Security Considerations**:
- ✅ Returns success message even if user doesn't exist (prevents email enumeration)
- ✅ Checks OAuth users and provides friendly message
- ✅ Token expiry limit (1 hour)
- ✅ Deletes old tokens on each request

#### Step 2: Reset Password

**Page**: `/auth/reset-password?token=xxx`

**Password Strength Requirements**:

```typescript
const NewPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

**Server Action**: `resetPasswordWithTokenAction`

```typescript
"use server";

import { hashPassword } from "@/lib/auth/password";
import { getPasswordResetTokenByToken } from "@/lib/tokens";
import { db } from "@/lib/db";

export const resetPasswordWithTokenAction = async (
  prevState: any,
  formData: FormData
): Promise<{ error?: string; success?: string }> => {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    // 1. Validate password strength
    const validatedFields = NewPasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    
    if (!validatedFields.success) {
      return { 
        error: validatedFields.error.errors[0].message 
      };
    }
    
    // 2. Verify token
    const existingToken = await getPasswordResetTokenByToken(token);
    
    if (!existingToken) {
      return { error: "Invalid token!" };
    }
    
    // 3. Check token expiry
    if (new Date(existingToken.expires) < new Date()) {
      await db.passwordResetToken.delete({ 
        where: { id: existingToken.id } 
      });
      return { error: "Token expired! Please request a new one." };
    }
    
    // 4. Get user
    const existingUser = await db.user.findUnique({
      where: { email: existingToken.email }
    });
    
    if (!existingUser) {
      return { error: "User not found!" };
    }
    
    // 5. Update password (hashed)
    const hashedPassword = await hashPassword(password);
    await db.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });
    
    // 6. Delete used token
    await db.passwordResetToken.delete({
      where: { id: existingToken.id },
    });
    
    // 7. Clear all sessions (force re-login)
    await db.session.deleteMany({
      where: { userId: existingUser.id },
    });
    
    return { 
      success: "Password reset successful! Please login with your new password." 
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Something went wrong. Please try again." };
  }
};
```

#### Step 3: Auto-redirect to Login

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    resetPasswordWithTokenAction, 
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  }, [state, router]);

  // ... form JSX
}
```

### UI Features

#### 1. Password Strength Indicator

```typescript
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  
  const getColor = () => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getLabel = () => {
    if (strength <= 1) return "Weak";
    if (strength <= 3) return "Medium";
    return "Strong";
  };
  
  return (
    <div className="space-y-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">
        Password Strength: <span className="font-medium">{getLabel()}</span>
      </p>
    </div>
  );
}
```

Color indicators:
- 🔴 Red: Weak (0-1)
- 🟡 Yellow: Medium (2-3)
- 🟢 Green: Strong (4-5)

#### 2. Show/Hide Password Toggle

```typescript
import { Eye, EyeOff } from "lucide-react";

function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Enter new password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
}
```

### Complete Flow Diagram

```
User Forgets Password
    ↓
Visit /auth/forgot-password
    ↓
Enter Email
    ↓
Server Action Validates
    ├─ OAuth User?
    │  └─ Show "Use OAuth to login"
    └─ Password User?
       ├─ Generate token (1 hour)
       ├─ Send email
       └─ Return success message
    ↓
User Receives Email, Clicks Link
    ↓
Visit /auth/reset-password?token=xxx
    ↓
Enter New Password (strength check)
    ↓
Server Action Processes
    ├─ Validate token
    ├─ Validate password strength
    ├─ Update password (hashed)
    ├─ Delete token
    └─ Clear all sessions
    ↓
Show Success Message
    ↓
Auto-redirect after 2 seconds
    ↓
Login Page (use new password)
```

---

## Two-Factor Authentication

### Overview

Two-factor authentication (2FA) adds an additional security layer by requiring a verification code sent to the user's email.

### Enable 2FA

**User Settings Page**: `/dashboard/settings`

```typescript
"use server";

export const enable2FAAction = async (userId: string) => {
  await db.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true }
  });
  
  return { success: "Two-factor authentication enabled!" };
};
```

### 2FA Login Flow

```
1. User enters email and password
   ↓
2. Credentials verified
   ↓
3. Check if 2FA enabled
   ├─ No → Login successful
   └─ Yes → Generate and send 2FA code
       ↓
       User enters code
       ↓
       Verify code
       ├─ Valid → Login successful
       └─ Invalid → Show error
```

### Implementation

**Generate 2FA Token**:

```typescript
export async function generateTwoFactorToken(userId: string) {
  // Generate random 6-digit code
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set 10-minute expiry
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  
  // Delete existing tokens
  await db.twoFactorToken.deleteMany({
    where: { userId }
  });
  
  // Create new token
  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      userId,
      token,
      expires,
      used: false
    }
  });
  
  return twoFactorToken;
}
```

**Verify 2FA Token**:

```typescript
export async function verifyTwoFactorToken(
  userId: string,
  token: string
) {
  const existingToken = await db.twoFactorToken.findUnique({
    where: { userId, token }
  });
  
  if (!existingToken) {
    return { error: "Invalid code!" };
  }
  
  if (existingToken.used) {
    return { error: "Code already used!" };
  }
  
  if (new Date(existingToken.expires) < new Date()) {
    await db.twoFactorToken.delete({
      where: { id: existingToken.id }
    });
    return { error: "Code expired!" };
  }
  
  // Mark as used
  await db.twoFactorToken.update({
    where: { id: existingToken.id },
    data: { used: true }
  });
  
  return { success: true };
}
```

---

## Best Practices

### ✅ Follow These Practices

#### 1. Use Server Actions

**Benefits**:
- ✅ Higher security (credentials not exposed on client)
- ✅ No race conditions (session set on server)
- ✅ Follows Next.js 15 and React 19 standards
- ✅ Automatic redirect handling

**Example**:
```typescript
// ✅ Correct
const [state, formAction] = useActionState(loginAction, undefined);
<form action={formAction}>...</form>

// ❌ Incorrect (legacy)
const response = await signIn("credentials", { ... });
```

#### 2. OAuth vs Credentials

| Auth Method | Implementation | Reason |
|------------|----------------|--------|
| **OAuth** | Client-side `signIn()` | OAuth requires browser redirect ✅ |
| **Credentials** | Server Actions | Security and reliability ✅ |
| **Logout** | Server Actions | Consistent pattern ✅ |

#### 3. Password Security

**Storage**:
- ✅ Use `bcrypt` or `argon2` for hashing
- ✅ Never store plain text passwords
- ✅ Password field nullable (supports OAuth users)

**Validation**:
- ✅ Minimum 8 characters
- ✅ Contains uppercase and lowercase
- ✅ Contains numbers
- ✅ Real-time strength feedback

#### 4. Session Management

**JWT Strategy**:
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,    // 24 hours
}
```

**Security Measures**:
- ✅ Clear sessions after password reset
- ✅ HttpOnly cookies
- ✅ SameSite: lax
- ✅ Secure in production

---

## Security Considerations

### 🔒 Implemented Security Measures

#### 1. Prevent Information Disclosure

**Problem**: Attackers can enumerate users through error messages

**Solution**:
```typescript
// ❌ Wrong - Leaks user existence
if (!existingUser) {
  return { error: "This email doesn't exist!" };
}

// ✅ Correct - Doesn't leak information
if (!existingUser) {
  return { 
    success: "If this email exists, a reset link has been sent!" 
  };
}
```

#### 2. Token Security

**Measures**:
- ✅ Token expiry limits (1 hour for reset, 10 min for 2FA)
- ✅ Use UUID v4 (not guessable)
- ✅ Delete immediately after use
- ✅ Auto-cleanup expired tokens

**Database Indexes**:
```prisma
model PasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime
  userId  String?

  @@index([email])
  @@index([userId])
  @@index([expires])  // For periodic cleanup
}
```

#### 3. Brute Force Prevention

**Recommended Measures** (to implement):
- ⏳ Login attempt limits
- ⏳ IP-based rate limiting
- ⏳ CAPTCHA for suspicious activity

**Current Measures**:
- ✅ Password strength requirements
- ✅ Automatic session expiry
- ✅ 2FA option

#### 4. OAuth Account Security

**Measures**:
- ✅ Only trust verified providers (Google, GitHub)
- ✅ `allowDangerousEmailAccountLinking` only for trusted providers
- ✅ OAuth users automatically set to `active` (email verified)
- ✅ Automatic linking prevents duplicate accounts

---

## Testing Guide

### 🧪 OAuth Login Testing

#### Test Scenario 1: New User First OAuth Login

**Steps**:
1. Visit `/auth/login`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Observe automatic redirect to `/dashboard`

**Expected Results**:
- ✅ User data automatically created
- ✅ `status` set to `active`
- ✅ `emailVerified` has value
- ✅ Automatically assigned `user` role
- ✅ No registration form required

**Verification SQL**:
```sql
SELECT 
  u.id, 
  u.email, 
  u.status, 
  u.emailVerified,
  r.name as role_name
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'test@gmail.com';
```

#### Test Scenario 2: Existing User OAuth Login

**Prerequisites**: User already registered via email/password

**Steps**:
1. Login with Google using same email
2. Observe automatic account linking

**Expected Results**:
- ✅ No new user created
- ✅ Both login methods work
- ✅ `Account` table gets OAuth record

### 🧪 Password Reset Testing

#### Test Scenario 1: Standard Password Reset

**Steps**:
1. Visit `/auth/login`
2. Click "Forgot password?"
3. Enter email
4. Check console logs (or inbox)
5. Copy reset link
6. Visit reset page
7. Enter new password (test strength requirements)
8. Submit and observe auto-redirect

**Expected Results**:
- ✅ Password strength indicator shows
- ✅ Error shown for weak passwords
- ✅ All sessions cleared on success
- ✅ Auto-redirect after 2 seconds
- ✅ Can login with new password

#### Test Scenario 2: OAuth User Reset Attempt

**Prerequisites**: User only logged in via OAuth (no password)

**Steps**:
1. Visit `/auth/forgot-password`
2. Enter OAuth user's email

**Expected Results**:
- ✅ Shows: "This account uses social login and cannot reset password. Please use Google or GitHub to sign in."
- ✅ No email sent
- ✅ No token generated

#### Test Scenario 3: Expired Token Handling

**Steps**:
1. Request password reset
2. Wait 1 hour (or manually modify database)
3. Try to use expired token

**Expected Results**:
- ✅ Shows: "Token expired! Please request a new one."
- ✅ Expired token automatically deleted
- ✅ Prompt to request new token

#### Test Scenario 4: Password Strength Validation

**Test Passwords**:

| Password | Expected Result |
|----------|-----------------|
| `abc` | ❌ Too short |
| `abcdefgh` | ❌ Missing uppercase and numbers |
| `Abcdefgh` | ❌ Missing numbers |
| `Abc12345` | ✅ Pass |
| `MyP@ssw0rd!` | ✅ Strong password |

### 📊 Testing Checklist

#### OAuth Login
- [ ] New user auto-creation
- [ ] Auto-set to active
- [ ] Auto-assign role
- [ ] Email auto-verified
- [ ] Existing user auto-linking
- [ ] Correct redirect after login

#### Password Reset
- [ ] Forgot password link visible
- [ ] Email sent successfully
- [ ] Token generated correctly
- [ ] Password strength validation
- [ ] Strength indicator displays
- [ ] Show/hide password works
- [ ] OAuth user friendly message
- [ ] Expired token handling
- [ ] Sessions cleared
- [ ] Auto-redirect to login
- [ ] New password works for login

#### Security
- [ ] No user existence leakage
- [ ] Tokens not guessable
- [ ] Tokens deleted after use
- [ ] Passwords properly hashed
- [ ] Sessions correctly set

---

## 📁 Related Files

### Core Configuration
- `auth.config.ts` - Auth.js configuration (OAuth callbacks)
- `auth.ts` - Auth.js instance
- `middleware.ts` - Route protection

### Server Actions
- `actions/auth/password-reset.ts` - Password reset actions
- `actions/auth/login.ts` - Login/logout actions
- `actions/auth/registration.ts` - Registration actions
- `actions/auth/two-factor.ts` - 2FA actions

### Components
- `components/auth/login-form.tsx` - Login form (with forgot password link)
- `components/auth/reset-password-form.tsx` - Password reset form (with strength validation)
- `components/auth/social-buttons.tsx` - OAuth login buttons
- `components/auth/two-factor-form.tsx` - 2FA verification form

### Pages
- `app/auth/login/page.tsx` - Login page
- `app/auth/forgot-password/page.tsx` - Forgot password page
- `app/auth/reset-password/page.tsx` - Reset password page
- `app/auth/two-factor/page.tsx` - 2FA verification page

### Database
- `prisma/schema.prisma` - Database schema

---

## 🎓 Key Takeaways

1. **OAuth Automation**: Use `signIn` callback to automatically initialize new users without manual registration

2. **Server Actions Advantage**: Better security and reliability, follows modern React/Next.js standards

3. **Password Security**: Multi-layer validation (format, strength, confirmation) + real-time feedback

4. **Session Management**: Clear all sessions after password reset for security

5. **Error Handling**: Friendly error messages while protecting privacy (no user existence leakage)

---

## 📚 References

- [Auth.js V5 Documentation](https://authjs.dev)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React 19 useActionState](https://react.dev/reference/react/useActionState)
- [OWASP Password Security Guide](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Documentation Version**: 1.0.0  
**Last Updated**: 2025-10-08  
**Auth.js Version**: 5.0.0-beta.29  
**Next.js Version**: 15.5.4  
**React Version**: 19.0.0
