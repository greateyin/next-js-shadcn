-- 檢查用戶登入後無法到達 Dashboard 的問題
-- 連接字串: psql 'postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost?sslmode=require&channel_binding=require'

-- ============================================================================
-- 1. 檢查所有用戶
-- ============================================================================
SELECT 
    id,
    email,
    name,
    status,
    "emailVerified",
    "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

-- ============================================================================
-- 2. 檢查用戶角色分配 (重要！)
-- ============================================================================
SELECT 
    u.email,
    u.name,
    u.status,
    r.name as role_name,
    ur."createdAt" as role_assigned_at
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
ORDER BY u."createdAt" DESC
LIMIT 20;

-- ============================================================================
-- 3. 檢查是否有用戶沒有角色 (這是問題所在！)
-- ============================================================================
SELECT 
    u.id,
    u.email,
    u.name,
    u.status,
    COUNT(ur.id) as role_count
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
GROUP BY u.id, u.email, u.name, u.status
HAVING COUNT(ur.id) = 0
ORDER BY u."createdAt" DESC;

-- ============================================================================
-- 4. 檢查系統中有哪些角色
-- ============================================================================
SELECT 
    id,
    name,
    "createdAt"
FROM "Role"
ORDER BY name;

-- ============================================================================
-- 5. 檢查最近登入的用戶（如果有登入記錄表）
-- ============================================================================
SELECT 
    u.email,
    u.name,
    u.status,
    u."lastSuccessfulLogin",
    u."lastLoginAttempt"
FROM "User" u
ORDER BY u."lastSuccessfulLogin" DESC NULLS LAST
LIMIT 10;

-- ============================================================================
-- 6. 檢查用戶權限（完整視圖）
-- ============================================================================
SELECT 
    u.email,
    u.status,
    r.name as role_name,
    p.name as permission_name,
    a.path as application_path
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
LEFT JOIN "ApplicationRole" ar ON r.id = ar."roleId"
LEFT JOIN "Application" a ON ar."applicationId" = a.id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- 替換為您的登入郵箱
ORDER BY r.name, p.name;

-- ============================================================================
-- 7. 快速修復：為所有沒有角色的用戶添加 'user' 角色
-- ============================================================================
-- 警告：執行前請先確認！

-- 7.1 檢查是否存在 'user' 角色
SELECT id, name FROM "Role" WHERE name = 'user';

-- 7.2 如果不存在，創建 'user' 角色
INSERT INTO "Role" (id, name, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'user',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- 7.3 為所有沒有角色的用戶添加 'user' 角色
INSERT INTO "UserRole" ("userId", "roleId", "createdAt", "updatedAt")
SELECT 
    u.id,
    (SELECT id FROM "Role" WHERE name = 'user'),
    NOW(),
    NOW()
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
WHERE ur.id IS NULL
  AND u.status = 'active'  -- 只為活躍用戶添加
ON CONFLICT DO NOTHING;

-- 7.4 驗證修復結果
SELECT 
    u.email,
    u.status,
    r.name as role_name,
    ur."createdAt" as role_assigned_at
FROM "User" u
LEFT JOIN "UserRole" ur ON u.id = ur."userId"
LEFT JOIN "Role" r ON ur."roleId" = r.id
WHERE u.status = 'active'
ORDER BY u.email;
