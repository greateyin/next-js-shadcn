# 快速參考指南

## 📚 文件導航

### 資料庫相關
- **Schema 定義**: `prisma/schema.prisma`
- **數據庫遷移**: `prisma/migrations/`
- **數據庫種子**: `prisma/seed.ts`

### 認證相關
- **認證配置**: `auth.config.ts`
- **認證主文件**: `auth.ts`
- **認證中間件**: `middleware.ts`
- **角色服務**: `lib/auth/roleService.ts`
- **管理員檢查**: `lib/auth/admin-check.ts`
- **子域認證**: `lib/auth/subdomain-auth.ts`

### 菜單系統
- **菜單查詢**: `lib/menu.ts`
- **菜單操作**: `actions/menu/index.ts`
- **菜單 API**: `app/api/admin/roles/[roleId]/menu-access/route.ts`

### 應用管理
- **應用操作**: `actions/application/index.ts`
- **應用 API**: `app/api/admin/applications/route.ts`

### 用戶管理
- **用戶操作**: `actions/user/index.ts`
- **用戶查詢**: `actions/user/queries.ts`
- **用戶 API**: `app/api/admin/users/route.ts`

---

## 🔑 核心概念速查

### 用戶狀態 (UserStatus)
```
pending   → 待驗證
active    → 活躍
suspended → 暫停
banned    → 禁用
deleted   → 已刪除
inactive  → 非活躍
```

### 菜單項目類型 (MenuItemType)
```
LINK      → 普通鏈接
GROUP     → 分組標題（不可點擊）
DIVIDER   → 分隔線
EXTERNAL  → 外部鏈接
```

### 默認角色 (DefaultRole)
```
user      → 普通用戶
admin     → 管理員
```

---

## 🚀 常見操作

### 1. 檢查用戶權限
```typescript
import { hasPermission } from '@/lib/auth/roleService';

const canDelete = await hasPermission(userId, 'users:delete');
if (!canDelete) {
  throw new Error('Insufficient permissions');
}
```

### 2. 檢查應用訪問
```typescript
import { hasApplicationAccess } from '@/lib/auth/roleService';

const hasAccess = await hasApplicationAccess(userId, 'admin');
if (!hasAccess) {
  return { error: 'No access to this application' };
}
```

### 3. 獲取用戶菜單
```typescript
import { getUserMenuItems } from '@/lib/menu';

const menuItems = await getUserMenuItems(userId, applicationId);
// 返回用戶可見的層級菜單
```

### 4. 檢查菜單訪問
```typescript
import { canUserAccessMenuItem } from '@/lib/menu';

const canAccess = await canUserAccessMenuItem(userId, menuItemId);
if (!canAccess) {
  return { error: 'Cannot access this menu item' };
}
```

### 5. 創建菜單項目
```typescript
import { createMenuItem } from '@/actions/menu';

const result = await createMenuItem({
  name: 'dashboard',
  displayName: 'Dashboard',
  path: '/dashboard',
  applicationId: 'app-id',
  icon: 'LayoutDashboard',
  type: 'LINK',
  order: 1,
  isVisible: true,
  isDisabled: false
});
```

### 6. 管理菜單角色訪問
```typescript
import { manageMenuItemRoles } from '@/actions/menu';

const result = await manageMenuItemRoles({
  menuItemId: 'menu-id',
  roleIds: ['role-id-1', 'role-id-2'],
  canView: true,
  canAccess: true
});
```

### 7. 獲取用戶完整權限信息
```typescript
import { getUserRolesAndPermissions } from '@/lib/auth/roleService';

const userInfo = await getUserRolesAndPermissions(userId);
// 返回: { id, email, name, roles, permissions, applications }
```

---

## 🔐 權限檢查層次

### 層次 1: 中間件 (middleware.ts)
```typescript
// 自動檢查所有請求
- 認證狀態
- 管理員角色
- 應用訪問權限
```

### 層次 2: API 路由 (lib/auth/auth.middleware.ts)
```typescript
// 在 API 路由中使用
export async function GET(req: Request) {
  const { error, user } = await verifyAuth(req);
  if (error) return error;

  // 檢查特定權限
  if (!user.permissions.includes('users:read')) {
    return new Response('Forbidden', { status: 403 });
  }
}
```

### 層次 3: Server Actions (actions/*)
```typescript
// 在 Server Actions 中使用
export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // 檢查權限
  const hasPermission = await hasPermission(
    session.user.id,
    'users:delete'
  );
  if (!hasPermission) {
    return { error: 'Insufficient permissions' };
  }
}
```

---

## 📊 查詢示例

### 獲取用戶的所有角色
```typescript
const userRoles = await db.userRole.findMany({
  where: { userId },
  include: { role: true }
});
```

### 獲取角色的所有權限
```typescript
const rolePermissions = await db.rolePermission.findMany({
  where: { roleId },
  include: { permission: true }
});
```

### 獲取應用的所有菜單
```typescript
const menuItems = await db.menuItem.findMany({
  where: { applicationId },
  include: { roleAccess: true, children: true }
});
```

### 獲取菜單項目的角色訪問
```typescript
const menuAccess = await db.menuItemRole.findMany({
  where: { menuItemId },
  include: { role: true }
});
```

### 獲取用戶的所有應用
```typescript
const applications = await db.application.findMany({
  where: {
    roles: {
      some: {
        role: {
          users: {
            some: { userId }
          }
        }
      }
    }
  }
});
```

---

## 🛠️ 常見問題解決

### Q: 如何添加新權限？
```typescript
// 1. 在 roleService.ts 的 createDefaultRolesAndPermissions() 中添加
{ name: 'reports:export', description: 'Export reports' }

// 2. 運行 seed
pnpm prisma:seed

// 3. 在角色中分配權限
await db.rolePermission.create({
  data: {
    roleId: 'admin-role-id',
    permissionId: 'reports:export-id'
  }
});
```

### Q: 如何限制菜單項目的訪問？
```typescript
// 1. 創建菜單項目
const menuItem = await db.menuItem.create({
  data: { /* ... */ }
});

// 2. 添加角色訪問限制
await db.menuItemRole.create({
  data: {
    menuItemId: menuItem.id,
    roleId: 'admin-role-id',
    canView: true,
    canAccess: true
  }
});
```

### Q: 如何檢查用戶是否為管理員？
```typescript
import { checkAdminAuth } from '@/lib/auth/admin-check';

const { error, session } = await checkAdminAuth();
if (error) return error;

// session.user 是管理員
```

### Q: 如何在 Server Component 中獲取用戶菜單？
```typescript
import { auth } from '@/auth';
import { getUserMenuItems } from '@/lib/menu';

export default async function MenuComponent() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const menuItems = await getUserMenuItems(session.user.id);

  return (
    <nav>
      {menuItems.map(item => (
        <MenuItem key={item.id} item={item} />
      ))}
    </nav>
  );
}
```

---

## 📈 性能優化建議

### 1. 使用 select 減少查詢字段
```typescript
// ❌ 不好
const user = await db.user.findUnique({ where: { id } });

// ✅ 好
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true }
});
```

### 2. 使用 include 進行關聯查詢
```typescript
// ❌ 不好 - N+1 查詢
const users = await db.user.findMany();
for (const user of users) {
  const roles = await db.userRole.findMany({ where: { userId: user.id } });
}

// ✅ 好 - 單一查詢
const users = await db.user.findMany({
  include: { userRoles: { include: { role: true } } }
});
```

### 3. 使用事務進行批量操作
```typescript
// ✅ 好 - 原子性操作
await db.$transaction(async (tx) => {
  await tx.menuItemRole.deleteMany({ where: { menuItemId } });
  await tx.menuItemRole.createMany({ data: newRoles });
});
```

---

## 🔗 相關文檔

- [完整分析報告](./PROJECT_ANALYSIS.md)
- [程式邏輯對應表](./LOGIC_DATABASE_MAPPING.md)
- [潛在問題與改進](./POTENTIAL_ISSUES_AND_IMPROVEMENTS.md)


