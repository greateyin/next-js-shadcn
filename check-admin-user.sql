-- Check admin@example.com user and their roles

-- 1. Find the user
SELECT 
    u.id,
    u.email,
    u.name,
    u.status,
    u."emailVerified",
    u."createdAt",
    u."updatedAt"
FROM "User" u
WHERE u.email = 'admin@example.com';

-- 2. Check if user has any roles
SELECT 
    ur.id,
    ur."userId",
    ur."roleId",
    r.name as role_name,
    r.description,
    ur."createdAt"
FROM "UserRole" ur
JOIN "Role" r ON ur."roleId" = r.id
WHERE ur."userId" = (SELECT id FROM "User" WHERE email = 'admin@example.com');

-- 3. Check all users and their role counts
SELECT 
    u.email,
    u.status,
    COUNT(ur.id) as role_count,
    STRING_AGG(r.name, ', ') as roles
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
GROUP BY u.id, u.email, u.status
ORDER BY u.email;

-- 4. Check if 'user' and 'admin' roles exist
SELECT 
    id,
    name,
    description,
    "createdAt"
FROM "Role"
WHERE name IN ('user', 'admin')
ORDER BY name;

-- 5. If admin@example.com has no roles, assign the 'admin' role
-- First, check if we need to assign roles
WITH admin_user AS (
    SELECT id FROM "User" WHERE email = 'admin@example.com'
),
admin_role AS (
    SELECT id FROM "Role" WHERE name = 'admin'
)
INSERT INTO "UserRole" ("userId", "roleId", "createdAt", "updatedAt")
SELECT au.id, ar.id, NOW(), NOW()
FROM admin_user au, admin_role ar
WHERE NOT EXISTS (
    SELECT 1 FROM "UserRole" 
    WHERE "userId" = au.id AND "roleId" = ar.id
)
ON CONFLICT DO NOTHING;

-- 6. Verify the assignment
SELECT 
    u.email,
    u.status,
    r.name as role_name,
    ur."createdAt" as role_assigned_at
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'admin@example.com'
ORDER BY u.email;

