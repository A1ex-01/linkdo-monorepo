---
artifact: plan-m6-frontend-hook
route: superpowers:writing-plans
skills: []
source: link-do-rbac
created_at: "2026-05-31"
---

# RBAC — M6: Frontend Permission Hook & 菜单控制 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `usePermission()` Zustand store 和 hook；实现 Sidebar 菜单按权限动态过滤；Frontend API 请求前自动带上权限 context。

**Architecture:** Zustand store 缓存当前用户的 permissions 列表；前端 UI 通过 `can(permCode)` 判断功能入口是否显示；后端 API 层（M3 中间件）做最终校验。

**Tech Stack:** React 19、Zustand、ahooks

---

## Task 1: 创建 Permission Store

### 6.1 创建 Zustand Store

**Files:**
- Create: `apps/frontend/src/stores/permission.ts`

- [ ] **Step 1: 创建 Permission Store**

```typescript
import { create } from 'zustand';
import type { PermissionCode } from '@/types/rbac';

interface IPermissionState {
  permissions: PermissionCode[];
  isLoaded: boolean;
  setPermissions: (perms: PermissionCode[]) => void;
  can: (code: string) => boolean;
  clear: () => void;
}

export const usePermissionStore = create<IPermissionState>((set, get) => ({
  permissions: [],
  isLoaded: false,

  setPermissions: (perms) => set({ permissions: perms, isLoaded: true }),

  can: (code: string) => {
    return get().permissions.includes(code as PermissionCode);
  },

  clear: () => set({ permissions: [], isLoaded: false }),
}));
```

---

## Task 2: 创建 Permission Hook

### 6.2 创建 usePermission Hook

**Files:**
- Create: `apps/frontend/src/hooks/use-permission.ts`

- [ ] **Step 1: 创建 usePermission Hook**

```typescript
import { usePermissionStore } from '@/stores/permission';

/**
 * Hook to check if the current user has a specific permission.
 * Usage: const canNotionSync = usePermission('notion_sync:enable');
 */
export function usePermission(code: string): boolean {
  const can = usePermissionStore((state) => state.can);
  return can(code);
}

/**
 * Hook to get all current user permissions.
 * Usage: const { permissions } = useAllPermissions();
 */
export function useAllPermissions() {
  const permissions = usePermissionStore((state) => state.permissions);
  const isLoaded = usePermissionStore((state) => state.isLoaded);
  return { permissions, isLoaded };
}
```

---

## Task 3: 权限数据加载

### 6.3 在 Root Layout 加载权限

**Files:**
- Modify: `apps/frontend/src/app/layout.tsx` 或 `apps/frontend/src/providers/base.tsx`

- [ ] **Step 1: 在 Layout 加载时获取权限**

找到 `Providers` 或 layout 组件，在用户登录后加载权限：

```tsx
// In your auth check / useEffect in layout or a dedicated auth provider:
import { usePermissionStore } from '@/stores/permission';
import { request } from '@/services/client-request';

async function loadPermissions() {
  // Call the /admin/me/permissions endpoint or existing /me endpoint
  const res = await request({ url: '/admin/me/permissions', method: 'get' });
  if (res.success && res.data) {
    usePermissionStore.getState().setPermissions(res.data);
  }
}

// Call loadPermissions() after user is authenticated
// (e.g., in useEffect when userStore.isFetchedUser is true)
```

---

## Task 4: Sidebar 菜单按权限过滤

### 6.4 过滤 BottomNav 和 Sidebar

**Files:**
- Modify: `apps/frontend/src/components/bottom-nav.tsx`
- Modify: `apps/frontend/src/components/sidebar.tsx`（如有）

- [ ] **Step 1: 在 BottomNav 中按权限过滤菜单**

```tsx
// In bottom-nav.tsx
import { usePermission } from '@/hooks/use-permission';

const navItems = [
  { label: 'Home', href: '/home', icon: IconHome },
  { label: 'Work', href: '/work', icon: IconBriefcase },
  { label: 'Statistics', href: '/stats', icon: IconChartBar, requiredPerm: 'stats:view' },
  { label: 'Settings', href: '/settings', icon: IconSettings },
];

export default function BottomNav() {
  const can = usePermission; // hook can't be called in loop, use store directly
  const { can: checkPerm } = usePermissionStore();

  const visibleItems = navItems.filter((item) => {
    if (!item.requiredPerm) return true;
    return checkPerm(item.requiredPerm);
  });

  return (/* existing nav rendering with visibleItems */);
}
```

- [ ] **Step 2: 在功能组件中按权限条件渲染**

例如在 Notion 同步入口处：

```tsx
// In a component that shows Notion sync button
import { usePermission } from '@/hooks/use-permission';

function NotionSyncButton() {
  const canNotionSync = usePermission('notion_sync:enable');

  if (!canNotionSync) return null;

  return <Button>Sync with Notion</Button>;
}
```

---

## Task 5: 提交

- [ ] **Step 1: 提交 M6**

```bash
cd apps/frontend && git add src/stores/permission.ts src/hooks/use-permission.ts src/components/bottom-nav.tsx src/app/layout.tsx  # or provider file
git commit -m "feat(rbac): M6 add usePermission hook and menu filtering"
```
