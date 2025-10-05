# 🔒 安全审计报告 - Admin API 权限修复

## 📅 审计日期
2025-10-05

## 🚨 发现的安全漏洞

### 严重程度：**高危 (Critical)**

**问题描述**：
所有 `/api/admin/*` 路由仅检查用户登录状态，未验证管理员权限。这意味着任何登录用户都可以通过直接调用 API 访问管理后台的敏感数据和操作。

### 影响范围

**受影响的文件数量**: 12 个 API 路由文件

#### 核心 API 路由
1. ✅ `app/api/admin/stats/route.ts` - 统计数据
2. ✅ `app/api/admin/applications/route.ts` - 应用管理
3. ✅ `app/api/admin/roles/route.ts` - 角色管理
4. ✅ `app/api/admin/users/route.ts` - 用户管理
5. ✅ `app/api/admin/users/[userId]/route.ts` - 单个用户操作
6. ✅ `app/api/admin/menu-items/route.ts` - 菜单项管理
7. ✅ `app/api/admin/permissions/route.ts` - 权限管理

#### 角色相关 API 路由
8. ✅ `app/api/admin/roles/[roleId]/route.ts` - 单个角色操作
9. ✅ `app/api/admin/roles/[roleId]/applications/route.ts` - 角色应用关联
10. ✅ `app/api/admin/roles/[roleId]/users/route.ts` - 角色用户关联
11. ✅ `app/api/admin/roles/[roleId]/permissions/route.ts` - 角色权限关联
12. ✅ `app/api/admin/roles/[roleId]/menu-access/route.ts` - 角色菜单访问

### 漏洞详情

**修复前的代码**（有漏洞）:
```typescript
export async function GET() {
  try {
    const session = await auth()
    
    // ❌ 只检查是否登录，任何登录用户都能访问
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // 敏感数据查询...
  }
}
```

**潜在攻击场景**:
1. 普通用户登录系统
2. 直接调用 `GET /api/admin/stats` 获取所有统计数据
3. 调用 `GET /api/admin/users` 获取所有用户信息
4. 调用 `PUT /api/admin/roles/[roleId]/permissions` 修改角色权限
5. 系统无法阻止这些操作

---

## ✅ 修复方案

### 1. 创建统一的权限检查工具

**新建文件**: `lib/auth/admin-check.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * 检查用户是否有管理员权限
 * @returns 如果有权限返回 session，否则返回 error response
 */
export async function checkAdminAuth() {
  const session = await auth();

  // 检查是否登录
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
      session: null,
    };
  }

  // 检查是否有管理员权限
  const isAdmin =
    session.user.role === "admin" ||
    session.user.roleNames?.includes("admin") ||
    session.user.roleNames?.includes("super-admin");

  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
      session: null,
    };
  }

  // 有权限，返回 session
  return {
    error: null,
    session,
  };
}
```

### 2. 应用修复到所有 API 路由

**修复后的代码**（安全）:
```typescript
import { checkAdminAuth } from "@/lib/auth/admin-check"

export async function GET() {
  try {
    // ✅ 同时检查登录和管理员权限
    const { error, session } = await checkAdminAuth()
    if (error) return error
    
    // 只有管理员能到达这里
    // 敏感数据查询...
  }
}
```

### 3. HTTP 状态码规范

修复后使用正确的 HTTP 状态码：
- **401 Unauthorized**: 未登录
- **403 Forbidden**: 已登录但无管理员权限

---

## 📊 修复统计

### 文件修改统计

| 类别 | 数量 |
|------|------|
| 新建文件 | 1 |
| 修改的 API 路由文件 | 12 |
| 受保护的 API 端点 | 28+ |
| 修改的代码行数 | ~200 行 |

### 修复的 API 端点

每个文件包含多个 HTTP 方法（GET, POST, PUT, PATCH, DELETE），总计保护了 **28+ 个 API 端点**。

---

## 🔍 验证方法

### 测试场景 1：未登录用户
```bash
curl http://localhost:3000/api/admin/stats
# 预期: 401 Unauthorized
# 响应: { "error": "Unauthorized - Please login" }
```

### 测试场景 2：普通登录用户
```bash
# 以普通用户身份登录后
curl -H "Cookie: next-auth.session-token=..." \
     http://localhost:3000/api/admin/stats
# 预期: 403 Forbidden
# 响应: { "error": "Forbidden - Admin access required" }
```

### 测试场景 3：管理员用户
```bash
# 以管理员身份登录后
curl -H "Cookie: next-auth.session-token=..." \
     http://localhost:3000/api/admin/stats
# 预期: 200 OK
# 响应: { users: {...}, roles: {...}, ... }
```

---

## 🛡️ 多层防护机制

修复后，系统现在拥有**三层安全防护**：

### 第1层：前端路由保护 (middleware.ts)
```typescript
// ✅ 已有保护
if (req.auth && (isAdminPage || isApiAdminRoute)) {
  if (!userHasAdminPrivileges && !hasAppAccess) {
    return NextResponse.redirect('/no-access')
  }
}
```

### 第2层：API 路由保护 (本次修复)
```typescript
// ✅ 新增保护
const { error, session } = await checkAdminAuth()
if (error) return error
```

### 第3层：Server Actions 保护
```typescript
// ✅ 已有保护
const session = await auth();
if (!session?.user?.id || session.user.role !== "admin") {
  return { error: "Unauthorized" };
}
```

---

## 📝 安全建议

### 已实施
1. ✅ 统一的权限检查函数
2. ✅ 正确的 HTTP 状态码
3. ✅ 多层防护机制
4. ✅ 角色基础访问控制 (RBAC)

### 进一步改进建议
1. 🔄 添加速率限制（防止暴力破解）
2. 🔄 添加审计日志（记录所有 admin 操作）
3. 🔄 添加 IP 白名单（限制 admin 访问来源）
4. 🔄 添加会话超时检查
5. 🔄 添加 CSRF 令牌保护

---

## 🎯 结论

### 修复完成度: **100%** ✅

**修复前**:
- ⚠️ 任何登录用户都可以访问 admin API
- ⚠️ 无权限验证
- ⚠️ 高风险的安全漏洞

**修复后**:
- ✅ 只有管理员可以访问 admin API
- ✅ 完整的权限验证
- ✅ 三层安全防护
- ✅ 符合安全最佳实践

---

## 📞 相关文档

- [权限检查工具](./lib/auth/admin-check.ts)
- [Middleware 配置](./middleware.ts)
- [路由配置](./routes.ts)

---

**审计人员**: AI Assistant  
**审计日期**: 2025-10-05  
**修复状态**: ✅ 全部完成  
**影响级别**: 高危 → 已解决  

*本报告记录了发现和修复的所有安全漏洞。*
