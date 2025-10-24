#!/bin/bash

# 完整的數據庫設置和修復腳本
# 用途：1) 執行 seed 腳本，2) 為 OAuth 用戶添加角色

echo "🌱 開始數據庫設置和修復..."
echo "=" | tr -d '\n' | xargs -I{} printf "%.s=" {1..50}
echo ""

# Step 1: 執行 Prisma Generate
echo ""
echo "📦 Step 1: 生成 Prisma Client..."
pnpm prisma generate

# Step 2: 執行 Seed 腳本
echo ""
echo "🌱 Step 2: 執行數據庫 Seed..."
pnpm prisma db seed

# Step 3: 為 OAuth 用戶添加角色
echo ""
echo "🔧 Step 3: 為 OAuth 用戶添加角色..."

# 創建臨時 SQL 文件
cat > /tmp/fix-oauth-user.sql << 'EOF'
-- 為 OAuth 用戶 dennis.yin@gmail.com 添加 'user' 角色
INSERT INTO "UserRole" (id, "userId", "roleId", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    (SELECT id FROM "User" WHERE email = 'dennis.yin@gmail.com'),
    (SELECT id FROM "Role" WHERE name = 'user'),
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 驗證結果
SELECT 
    u.email,
    u.name,
    r.name as role_name,
    ur."createdAt" as assigned_at
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'dennis.yin@gmail.com';
EOF

# 執行 SQL
psql 'postgresql://neondb_owner:npg_gVca5Gvpy9AJ@ep-fragrant-water-a13cqcbc-pooler.ap-southeast-1.aws.neon.tech/authmost?sslmode=require&channel_binding=require' < /tmp/fix-oauth-user.sql

# 清理臨時文件
rm /tmp/fix-oauth-user.sql

echo ""
echo "=" | tr -d '\n' | xargs -I{} printf "%.s=" {1..50}
echo ""
echo "✅ 設置和修復完成！"
echo ""
echo "📋 測試帳號："
echo "┌────────────────────────────────────────────┐"
echo "│ Email                 │ Password      │    │"
echo "├────────────────────────────────────────────┤"
echo "│ admin@example.com     │ Admin@123     │ ✅ │"
echo "│ user@example.com      │ User@123      │ ✅ │"
echo "│ moderator@example.com │ Moderator@123 │ ✅ │"
echo "│ test@example.com      │ Test@123      │ ✅ │"
echo "│ dennis.yin@gmail.com  │ (Google OAuth)│ ✅ │"
echo "└────────────────────────────────────────────┘"
echo ""
echo "🎯 下一步："
echo "1. 清除瀏覽器 cookies"
echo "2. 重新登入 dennis.yin@gmail.com"
echo "3. 應該能成功進入 Dashboard！"
echo ""
