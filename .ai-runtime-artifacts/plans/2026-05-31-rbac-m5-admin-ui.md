---
artifact: plan-m5-admin-ui
route: superpowers:writing-plans
skills: []
source: link-do-rbac
created_at: "2026-05-31"
---

# RBAC — M5: Admin 前端 — 角色管理 UI 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Admin 后台新增角色管理页面（角色列表 + 权限矩阵），用户列表加角色列和角色切换功能。

**Architecture:** TanStack Router 页面 + Shadcn UI 组件 + `useRequest` (ahooks) 数据获取。角色列表 → 点击进入权限矩阵页。权限矩阵用 Checkbox 表格，按 category 分组。

**Tech Stack:** React 19、TanStack Router、Shadcn UI、Tailwind CSS、ahooks

---

## Task 1: 创建 Admin RBAC Service

### 5.1 扩展 admin service

**Files:**
- Modify: `apps/admin/src/services/admin.ts`

- [ ] **Step 1: 添加 RBAC 相关 API 方法**

```typescript
// Add to admin.ts service

// Types
export interface Role {
  id: number
  name: string
  description: string
  is_system: boolean
  permissions: Permission[]
}

export interface Permission {
  id: number
  code: string
  name: string
  category: 'admin' | 'frontend'
  description: string
}

// API methods
export const roleService = {
  listRoles: (params?: { category?: string }) =>
    request({ url: '/admin/roles', method: 'get', params }),

  getRole: (id: number) =>
    request({ url: `/admin/roles/${id}`, method: 'get' }),

  createRole: (data: { name: string; description: string }) =>
    request({ url: '/admin/roles', method: 'post', data }),

  updateRole: (id: number, data: { name?: string; description?: string }) =>
    request({ url: `/admin/roles/${id}`, method: 'put', data }),

  deleteRole: (id: number) =>
    request({ url: `/admin/roles/${id}`, method: 'delete' }),

  getRolePermissions: (id: number) =>
    request({ url: `/admin/roles/${id}/permissions`, method: 'get' }),

  setRolePermissions: (id: number, permission_ids: number[]) =>
    request({ url: `/admin/roles/${id}/permissions`, method: 'put', data: { permission_ids } }),

  assignUserRole: (userId: number, roleId: number | null) =>
    request({ url: `/admin/users/${userId}/role`, method: 'put', data: { role_id: roleId } }),
}

export const permissionService = {
  list: (params?: { category?: string }) =>
    request({ url: '/admin/permissions', method: 'get', params }),
}
```

---

## Task 2: 角色列表页面

### 5.2 创建角色列表页

**Files:**
- Create: `apps/admin/src/routes/_authenticated/roles/index.tsx`

- [ ] **Step 1: 创建角色列表页**

```tsx
"use client";

import { roleService, type Role } from "@/services/admin";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, Trash2, Edit2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const route = createFileRoute('/_authenticated/roles/')

  useEffect(() => {
    roleService.listRoles().then((res) => {
      if (res.success && res.data) {
        setRoles(res.data);
      } else {
        toast.error(res.error || "Failed to load roles");
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (role: Role) => {
    if (role.is_system) {
      toast.error("Cannot delete system role");
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    const res = await roleService.deleteRole(role.id);
    if (res.success) {
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      toast.success("Role deleted");
    } else {
      toast.error(res.error || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground mt-1">
            Manage platform roles and their permissions.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Permissions</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    <span className="font-medium">{role.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {role.description || "—"}
                </td>
                <td className="px-4 py-3">
                  {role.is_system ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      System
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Custom
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {role.permissions?.length ?? 0} permissions
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded p-1.5 hover:bg-muted"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = `/roles/${role.id}`;
                        link.click();
                      }}
                    >
                      <Edit2 className="size-4" />
                    </button>
                    {!role.is_system && (
                      <button
                        className="rounded p-1.5 hover:bg-muted text-destructive"
                        onClick={() => handleDelete(role)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/roles/")({
  component: Roles,
});
```

---

## Task 3: 权限矩阵页面

### 5.3 创建角色详情/权限矩阵页

**Files:**
- Create: `apps/admin/src/routes/_authenticated/roles/$roleId.tsx`

- [ ] **Step 1: 创建权限矩阵页**

```tsx
"use client";

import { permissionService, roleService } from "@/services/admin";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function RoleDetail() {
  const route = createFileRoute('/_authenticated/roles/$roleId')
  const { roleId } = route.useParams() as { roleId: string }
  const id = parseInt(roleId, 10)

  const [allPerms, setAllPerms] = useState<any[]>([]);
  const [role, setRole] = useState<any>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      permissionService.list(),
      roleService.getRole(id),
    ]).then(([permRes, roleRes]) => {
      if (permRes.success && permRes.data) setAllPerms(permRes.data);
      if (roleRes.success && roleRes.data) {
        setRole(roleRes.data);
        const perms = roleRes.data.permissions || [];
        setSelected(new Set(perms.map((p: any) => p.id)));
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const togglePerm = (permId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await roleService.setRolePermissions(id, Array.from(selected));
    setSaving(false);
    if (res.success) {
      toast.success("Permissions updated");
    } else {
      toast.error(res.error || "Failed to update permissions");
    }
  };

  const adminPerms = allPerms.filter((p) => p.category === "admin");
  const frontendPerms = allPerms.filter((p) => p.category === "frontend");

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => history.back()} className="rounded p-1.5 hover:bg-muted">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{role?.name}</h2>
          <p className="text-muted-foreground mt-0.5">{role?.description}</p>
        </div>
        {!role?.is_system && (
          <button
            className="ml-auto flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      {role?.is_system && (
        <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          System roles cannot be edited. Permissions are read-only.
        </div>
      )}

      <PermMatrix
        title="Admin Permissions"
        permissions={adminPerms}
        selected={selected}
        onToggle={togglePerm}
        disabled={!!role?.is_system}
      />

      <PermMatrix
        title="Frontend Feature Permissions"
        permissions={frontendPerms}
        selected={selected}
        onToggle={togglePerm}
        disabled={!!role?.is_system}
      />
    </div>
  );
}

function PermMatrix({
  title,
  permissions,
  selected,
  onToggle,
  disabled,
}: {
  title: string;
  permissions: any[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  disabled: boolean;
}) {
  if (permissions.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="rounded-xl border bg-card">
        {permissions.map((perm) => (
          <div
            key={perm.id}
            className="flex items-center gap-3 border-b last:border-0 px-4 py-3"
          >
            <input
              type="checkbox"
              checked={selected.has(perm.id)}
              onChange={() => !disabled && onToggle(perm.id)}
              disabled={disabled}
              className="h-4 w-4 rounded border-input"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{perm.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{perm.code}</div>
            </div>
            <div className="text-xs text-muted-foreground">{perm.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/roles/$roleId")({
  component: RoleDetail,
});
```

---

## Task 4: 用户列表加角色列

### 5.4 修改用户表，加角色切换

**Files:**
- Modify: `apps/admin/src/routes/_authenticated/users/_components/users-columns.tsx`
- Modify: `apps/admin/src/routes/_authenticated/users/index.tsx`（如需更新搜索）

- [ ] **Step 1: 在用户列定义中加 Role 列**

在 `users-columns.tsx` 中添加角色列渲染：

```tsx
// In usersColumns definition, add:
{
  accessorKey: 'role',
  header: 'Role',
  cell: ({ row }) => {
    const role = row.original.role;
    return role ? (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        {role.name}
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">No role</span>
    );
  },
}
```

- [ ] **Step 2: 确保 users API 返回时 preload role**

确保 `adminService.listUsers` 的后端响应包含 `role` 字段（如果后端 `/admin/users` 响应没有 role，需要修改后端 service 加上 `Preload("Role")`）。

---

## Task 5: 侧边栏加角色管理菜单

### 5.5 添加侧边栏菜单

**Files:**
- Modify: `apps/admin/src/components/layout/data/sidebar-data.ts`

- [ ] **Step 1: 添加"角色管理"菜单项**

在 `sidebar-data.ts` 中添加：

```typescript
import { Shield } from 'lucide-react'

// In navGroups[0].items:
{
  title: 'Roles',
  url: '/roles',
  icon: Shield,
},
```

- [ ] **Step 2: 提交**

```bash
cd apps/admin && git add src/services/admin.ts src/routes/_authenticated/roles/index.tsx src/routes/_authenticated/roles/\$roleId.tsx src/routes/_authenticated/users/_components/users-columns.tsx src/components/layout/data/sidebar-data.ts
git commit -m "feat(rbac): M5 add role management UI to admin panel"
```
