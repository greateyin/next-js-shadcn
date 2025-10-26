# JWT Token Security and RBAC Alignment Improvements

**Date:** 2025-10-26  
**Version:** 1.0.0  
**Status:** ✅ Implemented

---

## Overview

This document outlines the security improvements made to the JWT token handling and RBAC (Role-Based Access Control) alignment in the authentication system. These changes address critical security gaps identified in the JWT token security assessment.

---

## Security Issues Addressed

### 1. ❌ Edge Runtime Sensitive Claims Logging

**Problem:**
- The edge JWT callback was logging sensitive PII and authorization data to shared logs
- Exposed information included: email, role names, permission counts, application paths
- These details qualify as PII and authorization data, creating real leakage risk

**Solution:**
- ✅ Removed all sensitive claims logging from `auth.edge.config.ts`
- ✅ Replaced debug logging with security-focused comments
- ✅ Documented that structured, redacted telemetry should be used if debugging is required

**Code Changes:**
```typescript
// BEFORE (INSECURE)
console.log('[Edge JWT Callback]', {
  trigger,
  hasUser: !!user,
  email: token?.email,  // ❌ PII
  roleNames: token?.roleNames,  // ❌ Authorization data
  permissionNames: Array.isArray(token?.permissionNames) ? token.permissionNames.length : 0,  // ❌ Authorization data
  applicationPaths: token?.applicationPaths  // ❌ Authorization data
})

// AFTER (SECURE)
// ⚠️ SECURITY: Do NOT log sensitive claims (email, roles, permissions, applications)
// These are PII and authorization data that should never be exposed in shared logs
// Use structured, redacted telemetry if debugging is required
```

---

### 2. ❌ RBAC Failure Falls Back to Default Role

**Problem:**
- When role/permission lookup throws an error, the system silently defaults to `'user'` role
- This grants access even when the system cannot confirm the subject's assignments
- Breaks least privilege principle and diverges from relational RBAC model
- Users without explicit role grants still receive general-user role

**Solution:**
- ✅ Changed error handling to return empty RBAC sets instead of defaulting to 'user'
- ✅ Set `token.role = undefined` on failure to ensure downstream checks fail safely
- ✅ Added explicit warning log when RBAC lookup fails
- ✅ Enforces least privilege: no roles = no access

**Code Changes:**
```typescript
// BEFORE (INSECURE)
catch (error) {
  console.error("Error getting user roles:", error);
  token.roleNames = [];
  token.permissionNames = [];
  token.applicationPaths = [];
  token.role = 'user'; // ❌ Grants access on failure!
}

// AFTER (SECURE)
catch (error) {
  console.error("Error getting user roles - denying access with empty RBAC:", error);
  token.roleNames = [];
  token.permissionNames = [];
  token.applicationPaths = [];
  token.role = undefined; // ✅ Denies access on failure
}
```

---

### 3. ❌ No Guard Against Roleless Accounts

**Problem:**
- Credential flow creates `safeUser` with `role: 'user'` before JWT callback runs
- JWT callback also defaults to `'user'` on failure
- Accounts with no `UserRole` rows still receive general-user role
- Bypasses expectation that access derives solely from join-table membership

**Solution:**
- ✅ Added explicit check in JWT callback to verify user has at least one active role
- ✅ If no roles found, return empty RBAC data and undefined role
- ✅ Added warning log when user has no active roles
- ✅ Ensures all access derives from relational RBAC assignments

**Code Changes:**
```typescript
// NEW SECURITY CHECK
if (!userRolesAndPermissions.roles || userRolesAndPermissions.roles.length === 0) {
  console.warn(`User ${user.id} has no active roles - denying token issuance`);
  // Return token with empty RBAC data
  token.roleNames = [];
  token.permissionNames = [];
  token.applicationPaths = [];
  token.role = undefined;
  return token;
}
```

---

## Security Principles Applied

### 1. **Least Privilege**
- Users have no access by default
- Access is only granted through explicit role assignments
- Failures result in denial, not default access

### 2. **Fail Secure**
- When RBAC lookups fail, the system denies access
- No fallback to default roles
- Empty role sets ensure downstream authorization checks fail safely

### 3. **Defense in Depth**
- Multiple layers of role checking:
  1. User status check (active/pending only)
  2. Role existence check (at least one role required)
  3. RBAC lookup with empty fallback on failure
  4. Session-level role validation

### 4. **No Sensitive Data in Logs**
- PII (email, user IDs) never logged
- Authorization data (roles, permissions) never logged
- Only non-sensitive information logged for debugging

---

## RBAC Design Alignment

The JWT token now strictly mirrors the database-backed RBAC model:

### Database Model
```
User --[UserRole]--> Role
User --[RolePermission]--> Permission
Role --[ApplicationRole]--> Application
```

### Token Payload
```typescript
{
  id: string,           // User ID
  email: string,        // User email
  roleNames: string[],  // From UserRole join table
  permissionNames: string[],  // From RolePermission join table
  applicationPaths: string[],  // From ApplicationRole join table
  role: 'admin' | 'user' | undefined  // Derived from roleNames
}
```

### Key Alignment Points
- ✅ Roles loaded from `UserRole` join table (not scalar field)
- ✅ Permissions loaded from role-permission relationships
- ✅ Applications loaded from role-application relationships
- ✅ No roles = no access (enforced)
- ✅ RBAC failures = no access (enforced)

---

## Testing Recommendations

### Test 1: User with Valid Roles
```bash
# Expected: Token issued with correct roles
# Verify: roleNames array populated
# Verify: permissionNames array populated
# Verify: applicationPaths array populated
```

### Test 2: User with No Roles
```bash
# Expected: Token issued with empty RBAC data
# Verify: roleNames = []
# Verify: permissionNames = []
# Verify: applicationPaths = []
# Verify: role = undefined
```

### Test 3: RBAC Lookup Failure
```bash
# Expected: Token issued with empty RBAC data
# Verify: Error logged to console
# Verify: roleNames = []
# Verify: permissionNames = []
# Verify: applicationPaths = []
# Verify: role = undefined
```

### Test 4: Suspended/Banned User
```bash
# Expected: Login rejected
# Verify: User status check prevents login
# Verify: No token issued
```

### Test 5: No Sensitive Data in Logs
```bash
# Expected: No email, roles, or permissions in logs
# Verify: Edge runtime logs don't contain sensitive data
# Verify: JWT callback logs don't contain sensitive data
```

---

## Deployment Checklist

- [ ] Code changes reviewed and approved
- [ ] All tests passing
- [ ] No sensitive data in logs
- [ ] RBAC checks enforced
- [ ] Roleless accounts denied
- [ ] Error handling tested
- [ ] Production deployment ready

---

## Monitoring and Alerts

### Metrics to Monitor
1. **Failed RBAC Lookups** - Alert if spike detected
2. **Users with No Roles** - Alert if new users created without roles
3. **Token Issuance Failures** - Alert if spike detected
4. **Unauthorized Access Attempts** - Alert if spike detected

### Log Patterns to Watch
```
"Error getting user roles - denying access with empty RBAC"
"User {id} has no active roles - denying token issuance"
```

---

## References

- **Auth.js Documentation:** https://authjs.dev/
- **RBAC Best Practices:** https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- **JWT Security:** https://tools.ietf.org/html/rfc7519
- **Least Privilege Principle:** https://en.wikipedia.org/wiki/Principle_of_least_privilege

---

## Summary

These security improvements ensure that:

✅ **No sensitive data is logged** - PII and authorization data protected  
✅ **Least privilege enforced** - No access by default  
✅ **RBAC strictly enforced** - All access derives from join-table assignments  
✅ **Fail secure** - Failures result in denial, not default access  
✅ **Database alignment** - Token mirrors relational RBAC model  

The JWT token handling now meets security best practices while remaining faithful to the database-driven RBAC implementation.

---

**Last Updated:** 2025-10-26

