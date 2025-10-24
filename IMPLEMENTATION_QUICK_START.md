# 🚀 改進實施快速開始指南

## 📋 前置條件

- Node.js 18+
- PostgreSQL 12+
- Prisma CLI

---

## 1️⃣ 數據庫遷移

### 步驟 1: 生成遷移
```bash
npx prisma migrate dev --name add_version_and_deletedAt
```

### 步驟 2: 驗證遷移
```bash
npx prisma db push
```

### 步驟 3: 檢查 schema
```bash
npx prisma studio
```

---

## 2️⃣ 初始化應用

### 在 `app.ts` 或 `middleware.ts` 中添加:

```typescript
import { initializePermissionNotifications } from '@/lib/events/permissionNotificationService';
import { warmUpPermissionCache } from '@/lib/auth/permissionPreloader';

// 應用啟動時
export async function initializeApp() {
  // 初始化通知服務
  initializePermissionNotifications();
  console.log('✅ Permission notifications initialized');

  // 預熱緩存 (可選，用於大型應用)
  const preloadedCount = await warmUpPermissionCache();
  console.log(`✅ Preloaded permissions for ${preloadedCount} users`);
}

// 在應用啟動時調用
await initializeApp();
```

---

## 3️⃣ 集成到現有代碼

### 在 Server Components 中檢查權限

```typescript
import { auth } from '@/auth';
import { checkPermissionsBeforeRender } from '@/lib/auth/permissionCheck';

export default async function AdminPage() {
  const session = await auth();
  
  const permCheck = await checkPermissionsBeforeRender(
    session,
    ['admin:read', 'admin:write']
  );

  if (!permCheck.allowed) {
    return <UnauthorizedPage missing={permCheck.missing} />;
  }

  return <AdminContent />;
}
```

### 在 Server Actions 中添加審計日誌

```typescript
import { logAuditSuccess, logAuditFailure } from '@/lib/audit/auditLogger';

export async function updateUser(data: UpdateUserInput) {
  try {
    const session = await auth();
    
    const result = await db.user.update({
      where: { id: data.id },
      data: { ...data }
    });

    // 記錄成功
    await logAuditSuccess(
      session.user.id,
      'UPDATE',
      'USER',
      data.id,
      result
    );

    return { success: true, data: result };
  } catch (error) {
    // 記錄失敗
    await logAuditFailure(
      session.user.id,
      'UPDATE',
      'USER',
      data.id,
      error.message
    );

    return { error: 'Failed to update user' };
  }
}
```

### 訂閱權限變更

```typescript
'use client';

import { useEffect } from 'react';
import { subscribeToPermissionChanges } from '@/lib/events/permissionNotificationService';

export function PermissionListener({ userId }: { userId: string }) {
  useEffect(() => {
    const unsubscribe = subscribeToPermissionChanges(userId, (event) => {
      console.log('Permissions changed:', event);
      
      // 刷新用戶數據
      window.location.reload();
      // 或使用 SWR/React Query 重新驗證
      // mutate('/api/user/permissions');
    });

    return unsubscribe;
  }, [userId]);

  return null;
}
```

---

## 4️⃣ 運行測試

### 運行緩存測試
```bash
npm test lib/auth/__tests__/permissionCache.test.ts
```

### 運行所有測試
```bash
npm test
```

---

## 5️⃣ 監控和調試

### 查看緩存統計
```typescript
import { permissionCache } from '@/lib/auth/permissionCache';

const stats = permissionCache.getStats();
console.log('Cache Stats:', stats);
// 輸出: { hits: 1000, misses: 50, invalidations: 10, hitRate: '95.24%' }
```

### 查看軟刪除統計
```typescript
import { getSoftDeleteStats } from '@/lib/softDelete/softDeleteManager';

const stats = await getSoftDeleteStats();
console.log('Soft Delete Stats:', stats);
// 輸出: { deletedUsers: 5, deletedRoles: 2, deletedMenuItems: 10, total: 17 }
```

### 查看菜單版本
```typescript
import { getMenuVersionInfo } from '@/lib/menu/menuVersion';

const versionInfo = await getMenuVersionInfo('app-id');
console.log('Menu Version:', versionInfo);
// 輸出: { applicationId: 'app-id', currentVersion: 42, lastUpdated: Date }
```

---

## 6️⃣ 常見任務

### 清空權限緩存
```typescript
import { clearPermissionCache } from '@/lib/auth/permissionCache';

clearPermissionCache();
```

### 軟刪除用戶
```typescript
import { softDeleteUser } from '@/lib/softDelete/softDeleteManager';

await softDeleteUser('user-id');
```

### 恢復軟刪除的用戶
```typescript
import { restoreUser } from '@/lib/softDelete/softDeleteManager';

await restoreUser('user-id');
```

### 獲取軟刪除的用戶
```typescript
import { getSoftDeletedUsers } from '@/lib/softDelete/softDeleteManager';

const deletedUsers = await getSoftDeletedUsers(50);
```

### 永久刪除 30 天前的軟刪除記錄
```typescript
import { permanentlyDeleteOldSoftDeletedRecords } from '@/lib/softDelete/softDeleteManager';

const result = await permanentlyDeleteOldSoftDeletedRecords(30);
console.log(`Deleted: ${result.deletedUsers} users, ${result.deletedRoles} roles`);
```

---

## 7️⃣ 性能優化建議

### 1. 調整緩存 TTL
```typescript
// 默認 5 分鐘，可根據需要調整
import { PermissionCacheManager } from '@/lib/auth/permissionCache';

const cache = new PermissionCacheManager(10); // 10 分鐘
```

### 2. 批量預加載
```typescript
import { preloadPermissionsByRole } from '@/lib/auth/permissionPreloader';

// 在應用啟動時預加載管理員權限
await preloadPermissionsByRole('admin');
```

### 3. 監控事件發射
```typescript
import { getPermissionEventEmitter } from '@/lib/events/permissionEventEmitter';

const emitter = getPermissionEventEmitter();
console.log('Event listeners:', emitter.listenerCount('permission:changed'));
```

---

## 8️⃣ 故障排除

### 問題: 緩存未生效
**解決方案**:
1. 檢查 `initializePermissionNotifications()` 是否被調用
2. 驗證 `permissionCache.set()` 是否被執行
3. 查看日誌中的 `[PermissionCache]` 消息

### 問題: 權限變更未實時更新
**解決方案**:
1. 確保 `emitUserPermissionsChanged()` 被調用
2. 檢查訂閱者是否正確註冊
3. 驗證 SSE 連接是否建立

### 問題: 性能未改善
**解決方案**:
1. 檢查緩存命中率: `permissionCache.getStats()`
2. 驗證 N+1 查詢是否已優化
3. 考慮增加 TTL 時間

---

## 📚 相關文檔

- [完整實施報告](./IMPLEMENTATION_COMPLETION_REPORT.md)
- [改進建議詳解](./POTENTIAL_ISSUES_AND_IMPROVEMENTS.md)
- [項目分析](./PROJECT_ANALYSIS.md)
- [快速參考](./QUICK_REFERENCE.md)

---

## 🎯 下一步

1. ✅ 運行數據庫遷移
2. ✅ 初始化應用
3. ✅ 集成到現有代碼
4. ✅ 運行測試
5. ✅ 監控性能
6. ✅ 部署到生產環境

---

**最後更新**: 2025-10-24  
**版本**: 1.0

