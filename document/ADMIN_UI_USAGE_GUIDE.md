# Admin UI 组件使用指南

**创建日期**: 2025-10-05  
**目标受众**: 开发人员

---

## 📚 快速开始

### 1. 导入组件

```typescript
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
  AdminLoadingState,
  AdminEmptyState,
} from "@/components/admin/common";
```

### 2. 基本页面结构

```typescript
export default function MyAdminPage() {
  return (
    <AdminPageContainer>
      {/* 页面标题 */}
      <AdminPageHeader
        title="Page Title"
        description="Page description"
      />

      {/* 页面内容 */}
      <AdminCard title="Section Title">
        {/* 你的内容 */}
      </AdminCard>
    </AdminPageContainer>
  );
}
```

---

## 🔧 组件详解

### AdminPageContainer

**用途**: 页面主容器，提供统一的布局和间距

**Props**:
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| children | ReactNode | ✅ | 页面内容 |
| className | string | ❌ | 额外的 CSS 类 |

**示例**:
```typescript
<AdminPageContainer>
  <AdminPageHeader title="Users" />
  <AdminCard>Content</AdminCard>
</AdminPageContainer>
```

---

### AdminPageHeader

**用途**: 页面标题区块，包含标题、描述和可选的操作按钮

**Props**:
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 页面标题 |
| description | string | ❌ | 页面描述 |
| action | ReactNode | ❌ | 操作按钮（如"添加"按钮） |
| className | string | ❌ | 额外的 CSS 类 |

**示例 1 - 基本使用**:
```typescript
<AdminPageHeader
  title="User Management"
  description="Manage system users and their roles"
/>
```

**示例 2 - 带操作按钮**:
```typescript
<AdminPageHeader
  title="User Management"
  description="Manage system users"
  action={
    <Button onClick={handleAddUser}>
      <Plus className="h-4 w-4 mr-2" />
      Add User
    </Button>
  }
/>
```

---

### AdminCard

**用途**: 标准化卡片组件，用于包装内容区块

**Props**:
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ❌ | 卡片标题 |
| description | string | ❌ | 卡片描述 |
| children | ReactNode | ✅ | 卡片内容 |
| headerAction | ReactNode | ❌ | Header 中的操作按钮 |
| noPadding | boolean | ❌ | 移除内容区padding（用于表格） |
| className | string | ❌ | 额外的 CSS 类 |

**示例 1 - 基本卡片**:
```typescript
<AdminCard
  title="Users"
  description="View and manage all registered users"
>
  <UsersTable users={users} />
</AdminCard>
```

**示例 2 - 无内边距（表格）**:
```typescript
<AdminCard
  title="Users"
  description="View and manage all registered users"
  noPadding
>
  <UsersTable users={users} />
</AdminCard>
```

**示例 3 - 带 Header 操作**:
```typescript
<AdminCard
  title="Users"
  description="View and manage all users"
  headerAction={
    <Button variant="outline" size="sm">
      Export
    </Button>
  }
  noPadding
>
  <UsersTable users={users} />
</AdminCard>
```

**示例 4 - 简单卡片（无标题）**:
```typescript
<AdminCard>
  <div className="space-y-4">
    <p>Some content</p>
  </div>
</AdminCard>
```

---

### AdminLoadingState

**用途**: 统一的加载状态显示

**Props**:
| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| message | string | ❌ | "Loading..." | 加载提示文字 |
| className | string | ❌ | - | 额外的 CSS 类 |

**示例 1 - 默认加载**:
```typescript
{isLoading && <AdminLoadingState />}
```

**示例 2 - 自定义消息**:
```typescript
{isLoading && <AdminLoadingState message="Loading users..." />}
```

**示例 3 - 在卡片中**:
```typescript
<AdminCard title="Users" noPadding>
  {isLoading ? (
    <AdminLoadingState message="Loading users..." />
  ) : (
    <UsersTable users={users} />
  )}
</AdminCard>
```

---

### AdminEmptyState

**用途**: 无数据时的友好提示

**Props**:
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 空状态标题 |
| description | string | ❌ | 空状态描述 |
| icon | ReactNode | ❌ | 图标 |
| action | ReactNode | ❌ | 操作按钮 |
| className | string | ❌ | 额外的 CSS 类 |

**示例 1 - 基本空状态**:
```typescript
{users.length === 0 && (
  <AdminEmptyState
    title="No users found"
    description="There are no users in the system yet"
  />
)}
```

**示例 2 - 带操作按钮**:
```typescript
<AdminEmptyState
  title="No users found"
  description="Add your first user to get started"
  action={
    <Button onClick={handleAddUser}>
      <Plus className="h-4 w-4 mr-2" />
      Add User
    </Button>
  }
/>
```

**示例 3 - 带图标**:
```typescript
import { Users } from "lucide-react";

<AdminEmptyState
  title="No users found"
  description="Try adjusting your search criteria"
  icon={<Users className="h-12 w-12" />}
/>
```

---

## 📖 完整示例

### 示例 1: 简单列表页面

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
  AdminLoadingState,
  AdminEmptyState,
} from "@/components/admin/common";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UsersTable } from "@/components/admin/users/UsersTable";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 加载数据
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    // ... 获取数据
    setIsLoading(false);
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="User Management"
        description="Manage system users and their roles"
        action={
          <Button onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        }
      />

      <AdminCard
        title="Users"
        description="View and manage all registered users"
        noPadding
      >
        {isLoading ? (
          <AdminLoadingState message="Loading users..." />
        ) : users.length === 0 ? (
          <AdminEmptyState
            title="No users found"
            description="Add your first user to get started"
            action={
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            }
          />
        ) : (
          <UsersTable users={users} />
        )}
      </AdminCard>
    </AdminPageContainer>
  );
}
```

---

### 示例 2: Dashboard 页面

```typescript
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
} from "@/components/admin/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStyles } from "@/lib/styles/admin";

export default function DashboardPage() {
  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Monitor and manage your system"
      />

      {/* 统计卡片网格 */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className={adminStyles.card.base}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={adminStyles.card.description}>
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${adminStyles.text.primary}`}>
              1,234
            </div>
            <p className={`text-xs ${adminStyles.text.tertiary} mt-1`}>
              +20% from last month
            </p>
          </CardContent>
        </Card>
        {/* 更多统计卡片... */}
      </div>

      {/* 主要内容区域 */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-7">
        <AdminCard
          title="Overview"
          className="col-span-4"
        >
          {/* 图表组件 */}
        </AdminCard>

        <AdminCard
          title="Recent Activity"
          description="Recent system activity"
          className="col-span-3"
        >
          {/* 活动列表 */}
        </AdminCard>
      </div>
    </AdminPageContainer>
  );
}
```

---

## 🎨 使用样式常量

除了组件，你也可以直接使用样式常量：

```typescript
import { adminStyles, cn } from "@/components/admin/common";

// 使用单个样式
<div className={adminStyles.text.primary}>主要文字</div>

// 组合多个样式
<div className={cn(
  adminStyles.card.base,
  "mt-4",
  isActive && "ring-2 ring-blue-500"
)}>
  内容
</div>

// 使用嵌套样式
<Card className={adminStyles.card.base}>
  <CardHeader className={adminStyles.card.header}>
    <CardTitle className={adminStyles.card.title}>
      标题
    </CardTitle>
  </CardHeader>
</Card>
```

---

## 🔄 重构现有页面

### 重构步骤

1. **导入新组件**:
```typescript
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminCard,
  AdminLoadingState,
} from "@/components/admin/common";
```

2. **替换页面容器**:
```typescript
// 旧代码
<div className="flex-1 space-y-6">

// 新代码
<AdminPageContainer>
```

3. **替换页面标题**:
```typescript
// 旧代码
<div className="flex items-center justify-between">
  <div>
    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
      User Management
    </h2>
    <p className="text-gray-600 mt-2">
      Manage system users and their roles
    </p>
  </div>
</div>

// 新代码
<AdminPageHeader
  title="User Management"
  description="Manage system users and their roles"
/>
```

4. **替换 Card**:
```typescript
// 旧代码
<Card className="border-gray-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
  <CardHeader className="border-b border-gray-100">
    <CardTitle className="text-lg font-semibold text-gray-900">
      Users
    </CardTitle>
    <CardDescription className="text-gray-600">
      View and manage all users
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    <UsersTable users={users} />
  </CardContent>
</Card>

// 新代码
<AdminCard
  title="Users"
  description="View and manage all users"
  noPadding
>
  <UsersTable users={users} />
</AdminCard>
```

5. **替换 Loading 状态**:
```typescript
// 旧代码
<div className="flex items-center justify-center p-8">
  <div className="text-gray-500">Loading...</div>
</div>

// 新代码
<AdminLoadingState />
```

---

## ✅ 最佳实践

### 1. 始终使用组件
✅ **推荐**:
```typescript
<AdminPageContainer>
  <AdminPageHeader title="Users" />
  <AdminCard title="Users List" noPadding>
    <UsersTable />
  </AdminCard>
</AdminPageContainer>
```

❌ **不推荐**:
```typescript
<div className="flex-1 space-y-6">
  <div className="flex items-center justify-between">
    <h2 className="text-3xl font-semibold text-gray-900">Users</h2>
  </div>
  <Card className="border-gray-200/50 bg-white/80">
    {/* ... */}
  </Card>
</div>
```

### 2. 使用 noPadding 用于表格
✅ **推荐**:
```typescript
<AdminCard title="Users" noPadding>
  <UsersTable />
</AdminCard>
```

❌ **不推荐**:
```typescript
<AdminCard title="Users">
  <UsersTable />
</AdminCard>
```

### 3. 统一的 Loading 和 Empty 状态
✅ **推荐**:
```typescript
{isLoading ? (
  <AdminLoadingState />
) : data.length === 0 ? (
  <AdminEmptyState title="No data" />
) : (
  <DataTable data={data} />
)}
```

### 4. 合理使用 headerAction
✅ **推荐**:
```typescript
<AdminCard
  title="Users"
  headerAction={<Button size="sm">Export</Button>}
>
  <UsersTable />
</AdminCard>
```

---

## 🎯 总结

使用这些统一组件的好处：

1. ✅ **代码减少 ~50%**
2. ✅ **样式统一 100%**
3. ✅ **维护更简单**
4. ✅ **开发更快速**
5. ✅ **类型安全**

---

**更新日期**: 2025-10-05  
**版本**: 1.0.0
