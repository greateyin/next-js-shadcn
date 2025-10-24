# 潛在問題與改進建議

## ⚠️ 潛在問題

### 1. **N+1 查詢問題**

#### 問題位置
- `lib/auth/roleService.ts` - `getUserRolesAndPermissions()`
- 當用戶有多個角色時，可能產生多次查詢

#### 當前代碼
```typescript
const roles = user.userRoles.map(userRole => userRole.role);
const permissions = user.userRoles.flatMap(userRole => 
  userRole.role.permissions.map(rolePermission => rolePermission.permission)
);
```

#### 改進建議
```typescript
// 使用單一查詢替代多次查詢
const user = await db.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
            applications: { include: { application: true } }
          }
        }
      }
    }
  }
});
```

### 2. **菜單查詢性能問題**

#### 問題
- `getUserMenuItems()` 每次都查詢所有菜單項目
- 沒有緩存機制
- 大量菜單項目時性能下降

#### 改進建議
```typescript
// 添加緩存層
import { cache } from 'react';

export const getUserMenuItemsCached = cache(async (userId: string) => {
  // 使用 React 的 cache() 函數進行請求級別的緩存
  return getUserMenuItems(userId);
});

// 或使用 Redis 進行應用級別的緩存
const cacheKey = `menu:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 3. **權限檢查的重複查詢**

#### 問題
- `hasPermission()` 每次都調用 `getUserRolesAndPermissions()`
- 如果在同一請求中檢查多個權限，會重複查詢

#### 改進建議
```typescript
// 在 Session 中緩存權限信息
export async function hasPermissionCached(
  session: Session,
  permissionName: string
): Promise<boolean> {
  // 直接從 session 中獲取，避免重複查詢
  return session.user.permissionNames?.includes(permissionName) ?? false;
}
```

### 4. **菜單項目循環引用檢查性能**

#### 問題
- `updateMenuItem()` 中的 `checkCircularReference()` 使用遞歸
- 深層菜單結構時性能差

#### 改進建議
```typescript
// 使用迭代替代遞歸
async function checkCircularReference(
  itemId: string,
  targetId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [itemId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === targetId) return true;
    
    const children = await db.menuItem.findMany({
      where: { parentId: current },
      select: { id: true }
    });
    
    queue.push(...children.map(c => c.id));
  }
  
  return false;
}
```

### 5. **缺少審計日誌記錄**

#### 問題
- 權限相關操作（創建/更新/刪除角色、菜單等）沒有記錄到 AuditLog
- 無法追蹤誰做了什麼操作

#### 改進建議
```typescript
// 在關鍵操作後記錄審計日誌
async function logAudit(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValue?: any,
  newValue?: any
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      status: 'SUCCESS',
      timestamp: new Date()
    }
  });
}
```

### 6. **缺少權限變更通知**

#### 問題
- 用戶權限變更後，已登入的用戶不會立即感知
- Session 中的權限信息可能過期

#### 改進建議
```typescript
// 實現權限變更事件
import { EventEmitter } from 'events';

const permissionEvents = new EventEmitter();

// 權限變更時發出事件
permissionEvents.emit('permission-changed', { userId, roleId });

// 前端監聽事件並刷新 Session
useEffect(() => {
  const handlePermissionChange = (data) => {
    if (data.userId === session.user.id) {
      // 刷新 Session
      update();
    }
  };
  
  permissionEvents.on('permission-changed', handlePermissionChange);
  return () => permissionEvents.off('permission-changed', handlePermissionChange);
}, [session]);
```

### 7. **缺少批量操作的驗證**

#### 問題
- `updateMenuItemsOrder()` 沒有驗證所有菜單項目是否存在
- 可能導致部分更新失敗

#### 改進建議
```typescript
export async function updateMenuItemsOrder(data: UpdateMenuItemsOrderInput) {
  // 驗證所有菜單項目存在
  const existingItems = await db.menuItem.findMany({
    where: {
      id: { in: data.items.map(i => i.id) }
    },
    select: { id: true }
  });
  
  if (existingItems.length !== data.items.length) {
    return { error: "Some menu items not found" };
  }
  
  // 使用事務更新
  await db.$transaction(
    data.items.map(item =>
      db.menuItem.update({
        where: { id: item.id },
        data: { order: item.order }
      })
    )
  );
}
```

---

## ✨ 改進建議

### 🔴 高優先級改進 (立即實施 - 本週)

#### 1. **添加權限緩存層** ⭐ 最高優先級
**預期效果**: 性能提升 50%+，減少數據庫查詢
**工作量**: 中等 (2-3 天)
**難度**: 中等

**實施步驟**:
1. 創建緩存管理類
2. 集成到 roleService.ts
3. 添加緩存失效機制
4. 編寫單元測試

```typescript
// lib/auth/permissionCache.ts
import { cache } from 'react';

interface CachedPermissions {
  data: any;
  timestamp: number;
}

class PermissionCache {
  private cache = new Map<string, CachedPermissions>();
  private ttl = 5 * 60 * 1000; // 5 分鐘

  async get(userId: string) {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`[Cache Hit] User: ${userId}`);
      return cached.data;
    }

    console.log(`[Cache Miss] User: ${userId}`);
    const data = await getUserRolesAndPermissions(userId);
    this.cache.set(userId, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(userId: string) {
    console.log(`[Cache Invalidated] User: ${userId}`);
    this.cache.delete(userId);
  }

  // 批量失效
  invalidateMany(userIds: string[]) {
    userIds.forEach(id => this.cache.delete(id));
  }
}

export const permissionCache = new PermissionCache();
```

**集成示例**:
```typescript
// lib/auth/roleService.ts
export async function getUserRolesAndPermissionsWithCache(userId: string) {
  return permissionCache.get(userId);
}

// 在更新權限後失效緩存
export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  // ... 更新邏輯

  // 失效所有擁有此角色的用戶的緩存
  const users = await db.userRole.findMany({
    where: { roleId },
    select: { userId: true }
  });

  permissionCache.invalidateMany(users.map(u => u.userId));
}
```

---

#### 2. **添加審計日誌記錄** ⭐ 最高優先級
**預期效果**: 提升安全性和合規性，完整的操作追蹤
**工作量**: 中等 (2-3 天)
**難度**: 中等

**實施步驟**:
1. 創建審計日誌工具函數
2. 在關鍵操作中添加日誌記錄
3. 創建審計日誌查詢 API
4. 添加審計日誌管理界面

```typescript
// lib/audit/auditLogger.ts
import { db } from '@/lib/db';

export interface AuditLogData {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(data: AuditLogData) {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        status: data.status,
        error: data.error || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// 便利函數
export async function logAuditSuccess(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  newValue?: any
) {
  await logAudit({
    userId,
    action,
    resourceType,
    resourceId,
    newValue,
    status: 'SUCCESS'
  });
}

export async function logAuditFailure(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  error: string
) {
  await logAudit({
    userId,
    action,
    resourceType,
    resourceId,
    status: 'FAILED',
    error
  });
}
```

**在 Server Actions 中使用**:
```typescript
// actions/role/index.ts
import { logAuditSuccess, logAuditFailure } from '@/lib/audit/auditLogger';

export async function createRole(data: CreateRoleInput) {
  const session = await auth();

  try {
    const role = await db.role.create({
      data: {
        name: data.name,
        description: data.description
      }
    });

    await logAuditSuccess(
      session.user.id,
      'CREATE',
      'ROLE',
      role.id,
      role
    );

    return { success: true, data: role };
  } catch (error) {
    await logAuditFailure(
      session.user.id,
      'CREATE',
      'ROLE',
      'unknown',
      error.message
    );
    throw error;
  }
}
```

---

#### 3. **優化 N+1 查詢問題** ⭐ 最高優先級
**預期效果**: 性能提升 30%+，減少數據庫往返
**工作量**: 小 (1-2 天)
**難度**: 低

**實施步驟**:
1. 分析當前查詢模式
2. 優化 Prisma include 語句
3. 添加性能監控
4. 進行性能測試

```typescript
// lib/auth/roleService.ts - 優化前
export async function getUserRolesAndPermissions(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userRoles: true }
  });

  // 這會產生多次查詢
  const roles = user.userRoles.map(userRole => userRole.role);
  const permissions = user.userRoles.flatMap(userRole =>
    userRole.role.permissions.map(rolePermission => rolePermission.permission)
  );
}

// 優化後 - 單一查詢
export async function getUserRolesAndPermissions(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              },
              applications: {
                include: { application: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  // 提取數據
  const roles = user.userRoles.map(ur => ur.role);
  const permissions = user.userRoles.flatMap(ur =>
    ur.role.permissions.map(rp => rp.permission)
  );
  const applications = user.userRoles.flatMap(ur =>
    ur.role.applications.map(ra => ra.application)
  );

  return { roles, permissions, applications };
}
```

---

### 🟡 中優先級改進 (短期實施 - 本月)

#### 4. **優化循環引用檢查**
**預期效果**: 深層菜單性能提升 40%+
**工作量**: 小 (1 天)
**難度**: 低

**實施步驟**:
1. 替換遞歸為迭代
2. 添加性能測試
3. 驗證功能正確性

```typescript
// lib/menu/circularReferenceCheck.ts - 優化前（遞歸）
async function checkCircularReferenceRecursive(
  itemId: string,
  targetId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (visited.has(itemId)) return false;
  if (itemId === targetId) return true;

  visited.add(itemId);

  const children = await db.menuItem.findMany({
    where: { parentId: itemId },
    select: { id: true }
  });

  for (const child of children) {
    if (await checkCircularReferenceRecursive(child.id, targetId, visited)) {
      return true;
    }
  }

  return false;
}

// 優化後（迭代）- 性能更好，避免棧溢出
async function checkCircularReference(
  itemId: string,
  targetId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [itemId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) continue;
    if (current === targetId) return true;

    visited.add(current);

    const children = await db.menuItem.findMany({
      where: { parentId: current },
      select: { id: true }
    });

    queue.push(...children.map(c => c.id));
  }

  return false;
}
```

---

#### 5. **實現權限預檢查**
**預期效果**: 提升用戶體驗，提前發現權限問題
**工作量**: 小 (1 天)
**難度**: 低

**實施步驟**:
1. 創建權限檢查工具
2. 在路由級別集成
3. 添加錯誤處理

```typescript
// lib/auth/permissionCheck.ts
import { Session } from 'next-auth';

export async function checkPermissionsBeforeRender(
  session: Session | null,
  requiredPermissions: string[]
): Promise<{ allowed: boolean; missing: string[] }> {
  if (!session?.user?.id) {
    return { allowed: false, missing: requiredPermissions };
  }

  const userPerms = await getUserRolesAndPermissions(session.user.id);
  const userPermNames = userPerms.permissions.map(p => p.name);

  const missing = requiredPermissions.filter(
    p => !userPermNames.includes(p)
  );

  return {
    allowed: missing.length === 0,
    missing
  };
}

// 在 Server Component 中使用
export async function ProtectedComponent({ requiredPermissions }: Props) {
  const session = await auth();
  const { allowed, missing } = await checkPermissionsBeforeRender(
    session,
    requiredPermissions
  );

  if (!allowed) {
    return <PermissionDenied missing={missing} />;
  }

  return <YourComponent />;
}
```

---

#### 6. **實現菜單版本控制**
**預期效果**: 優化緩存策略，減少不必要的菜單重新加載
**工作量**: 小 (1 天)
**難度**: 低

**實施步驟**:
1. 添加版本字段到 MenuItem
2. 創建版本檢查函數
3. 在前端集成版本檢查

```typescript
// prisma/schema.prisma - 添加版本字段
model MenuItem {
  // ... 現有字段
  version Int @default(1)
  updatedAt DateTime @updatedAt

  @@index([applicationId, version])
}

// lib/menu/menuVersion.ts
export async function getMenuVersion(applicationId: string): Promise<number> {
  const latest = await db.menuItem.findFirst({
    where: { applicationId },
    orderBy: { updatedAt: 'desc' },
    select: { version: true }
  });

  return latest?.version ?? 0;
}

// 在更新菜單時增加版本
export async function updateMenuItemWithVersion(
  id: string,
  data: any
) {
  const current = await db.menuItem.findUnique({
    where: { id },
    select: { version: true }
  });

  return db.menuItem.update({
    where: { id },
    data: {
      ...data,
      version: (current?.version ?? 0) + 1
    }
  });
}

// 前端檢查版本
export async function checkMenuVersionChanged(
  applicationId: string,
  currentVersion: number
): Promise<boolean> {
  const latestVersion = await getMenuVersion(applicationId);
  return latestVersion > currentVersion;
}
```

---

### 🟢 低優先級改進 (長期實施 - 本季度)

#### 7. **實現軟刪除**
**預期效果**: 提升數據恢復能力，提高數據安全性
**工作量**: 大 (3-5 天)
**難度**: 中等

**實施步驟**:
1. 為敏感表添加 deletedAt 字段
2. 創建軟刪除工具函數
3. 更新所有查詢邏輯
4. 創建恢復機制

```typescript
// prisma/schema.prisma - 為敏感表添加軟刪除
model Role {
  // ... 現有字段
  deletedAt DateTime?

  @@index([deletedAt])
}

model Permission {
  // ... 現有字段
  deletedAt DateTime?

  @@index([deletedAt])
}

model MenuItem {
  // ... 現有字段
  deletedAt DateTime?

  @@index([deletedAt])
}

// lib/softDelete/softDeleteHelper.ts
export async function softDeleteRole(roleId: string) {
  return db.role.update({
    where: { id: roleId },
    data: { deletedAt: new Date() }
  });
}

export async function restoreRole(roleId: string) {
  return db.role.update({
    where: { id: roleId },
    data: { deletedAt: null }
  });
}

// 查詢時自動過濾已刪除的記錄
export async function getActiveRoles() {
  return db.role.findMany({
    where: { deletedAt: null }
  });
}

// 查詢包括已刪除的記錄（管理員用）
export async function getAllRolesIncludingDeleted() {
  return db.role.findMany();
}
```

---

#### 8. **添加權限預加載**
**預期效果**: 應用啟動時性能提升，減少首次查詢延遲
**工作量**: 小 (1 天)
**難度**: 低

**實施步驟**:
1. 創建預加載函數
2. 在應用啟動時調用
3. 使用全局狀態存儲

```typescript
// lib/auth/permissionPreload.ts
let permissionCache: Map<string, string> | null = null;

export async function preloadPermissions() {
  if (permissionCache) return permissionCache;

  console.log('[Preload] Loading permissions...');
  const permissions = await db.permission.findMany({
    where: { deletedAt: null }
  });

  permissionCache = new Map(permissions.map(p => [p.name, p.id]));
  console.log(`[Preload] Loaded ${permissionCache.size} permissions`);

  return permissionCache;
}

export function getPermissionId(name: string): string | undefined {
  return permissionCache?.get(name);
}

// 在應用啟動時調用
// app/layout.tsx
export default async function RootLayout({ children }) {
  await preloadPermissions();
  return <>{children}</>;
}
```

---

#### 9. **實現權限變更事件通知**
**預期效果**: 實時權限更新，提升用戶體驗
**工作量**: 中等 (2-3 天)
**難度**: 中等

**實施步驟**:
1. 創建事件系統
2. 在權限變更時發出事件
3. 前端監聽並刷新

```typescript
// lib/events/permissionEvents.ts
import { EventEmitter } from 'events';

interface PermissionChangeEvent {
  userId: string;
  roleId?: string;
  action: 'ROLE_UPDATED' | 'PERMISSION_UPDATED' | 'USER_ROLE_CHANGED';
  timestamp: Date;
}

class PermissionEventEmitter extends EventEmitter {
  emitPermissionChange(event: PermissionChangeEvent) {
    this.emit('permission-changed', event);
    console.log(`[Event] Permission changed for user: ${event.userId}`);
  }

  onPermissionChange(callback: (event: PermissionChangeEvent) => void) {
    this.on('permission-changed', callback);
  }
}

export const permissionEvents = new PermissionEventEmitter();

// 在更新權限時發出事件
export async function updateRolePermissionsWithEvent(
  roleId: string,
  permissionIds: string[]
) {
  await db.rolePermission.deleteMany({ where: { roleId } });
  await db.rolePermission.createMany({
    data: permissionIds.map(permissionId => ({
      roleId,
      permissionId
    }))
  });

  // 獲取擁有此角色的所有用戶
  const users = await db.userRole.findMany({
    where: { roleId },
    select: { userId: true }
  });

  // 為每個用戶發出事件
  users.forEach(user => {
    permissionEvents.emitPermissionChange({
      userId: user.userId,
      roleId,
      action: 'PERMISSION_UPDATED',
      timestamp: new Date()
    });
  });
}

// 前端監聽事件
// components/PermissionListener.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function PermissionListener() {
  const { data: session, update } = useSession();

  useEffect(() => {
    const handlePermissionChange = async (event: any) => {
      if (event.userId === session?.user?.id) {
        console.log('[Client] Permission changed, refreshing session...');
        await update();
      }
    };

    // 這裡需要使用 WebSocket 或 Server-Sent Events
    // 簡化示例，實際應使用 Socket.io 或 Pusher

    return () => {
      // 清理監聽器
    };
  }, [session, update]);

  return null;
}
```

---

## 📋 改進優先級總結

| 優先級 | 項目 | 預期效果 | 工作量 | 難度 | 建議時間 |
|--------|------|--------|--------|------|---------|
| 🔴 高 | 添加權限緩存 | 性能 ↑50%+ | 中 | 中 | 本週 |
| 🔴 高 | 添加審計日誌 | 安全性 ↑ | 中 | 中 | 本週 |
| 🔴 高 | 優化 N+1 查詢 | 性能 ↑30%+ | 小 | 低 | 本週 |
| 🟡 中 | 優化循環引用檢查 | 性能 ↑40%+ | 小 | 低 | 本月 |
| 🟡 中 | 實現權限預檢查 | UX ↑ | 小 | 低 | 本月 |
| 🟡 中 | 菜單版本控制 | 緩存優化 | 小 | 低 | 本月 |
| 🟢 低 | 實現軟刪除 | 數據恢復 ↑ | 大 | 中 | 本季度 |
| 🟢 低 | 權限預加載 | 啟動性能 ↑ | 小 | 低 | 本季度 |
| 🟢 低 | 權限變更事件 | 實時性 ↑ | 中 | 中 | 本季度 |

---

## 🚀 實施路線圖

### 第 1 週 (高優先級)
- [ ] 實施權限緩存層
- [ ] 添加審計日誌記錄
- [ ] 優化 N+1 查詢
- **預期收益**: 性能提升 50%+，安全性提升

### 第 2-3 週 (中優先級)
- [ ] 優化循環引用檢查
- [ ] 實現權限預檢查
- [ ] 菜單版本控制
- **預期收益**: 用戶體驗提升，菜單性能優化

### 第 4 週+ (低優先級)
- [ ] 實現軟刪除
- [ ] 權限預加載
- [ ] 權限變更事件通知
- **預期收益**: 數據安全性提升，實時性提升

---

## 💡 實施建議

### 快速勝利 (Quick Wins)
1. **優化 N+1 查詢** - 最快見效，工作量小
2. **優化循環引用檢查** - 工作量小，效果明顯
3. **菜單版本控制** - 簡單易實施

### 核心改進 (Core Improvements)
1. **權限緩存層** - 最大性能提升
2. **審計日誌** - 最重要的安全改進
3. **權限預檢查** - 提升用戶體驗

### 長期優化 (Long-term)
1. **軟刪除** - 提升數據安全
2. **權限預加載** - 優化啟動性能
3. **實時事件** - 提升系統實時性

---

## 📊 預期收益

### 性能指標
- 權限查詢性能: **提升 50%+**
- 菜單查詢性能: **提升 30%+**
- 循環引用檢查: **提升 40%+**
- 整體系統性能: **提升 30-40%**

### 安全指標
- 操作追蹤: **100% 覆蓋**
- 數據恢復能力: **提升 100%**
- 合規性: **完全滿足**

### 用戶體驗
- 頁面加載速度: **提升 20-30%**
- 權限檢查延遲: **降低 50%+**
- 實時性: **大幅提升**


