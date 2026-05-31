---
artifact: rbac-design
route: superpowers:brainstorming
skills: []
source: link-do-rbac
created_at: "2026-05-31"
---

# Link-Do RBAC 权限管理系统设计

## 1. 背景与目标

Link-Do 目前通过邮箱白名单控制 Admin 后台访问，无角色、无权限、无菜单控制。本设计将现有体系升级为完整的 RBAC 模型，同时统一覆盖 Admin 后台操作权限和 Frontend 功能开关权限。

**设计决策汇总：**
- 平台级统一角色（非多租户/用户级）
- Admin 和 Frontend 共用同一套 Permission 表
- 统一 CRUD 风格命名（`{resource}:{action}`）
- 每个用户有且只有一个角色
- 简化版 RBAC（不用 Casbin 等外部库）

## 2. 数据模型

### 2.1 表结构

```
User 表（修改）
  - 新增: role_id BIGINT REFERENCES roles(id)

roles 表（新建）
  - id: BIGSERIAL PRIMARY KEY
  - name: VARCHAR(64) UNIQUE NOT NULL
  - description: TEXT
  - is_system: BOOLEAN DEFAULT FALSE  -- 防止误删内置角色
  - created_at: TIMESTAMP DEFAULT NOW()
  - updated_at: TIMESTAMP DEFAULT NOW()

permissions 表（新建）
  - id: BIGSERIAL PRIMARY KEY
  - code: VARCHAR(128) UNIQUE NOT NULL  -- 'tasks:read', 'notion_sync:enable'
  - name: VARCHAR(128)
  - category: VARCHAR(32)  -- 'admin' | 'frontend'
  - description: TEXT
  - created_at: TIMESTAMP DEFAULT NOW()

role_permissions 表（新建，N:M 映射）
  - role_id: BIGINT REFERENCES roles(id) ON DELETE CASCADE
  - permission_id: BIGINT REFERENCES permissions(id) ON DELETE CASCADE
  - PRIMARY KEY (role_id, permission_id)
```

### 2.2 内置角色（Seed Data）

| 角色 | is_system | 说明 |
|------|-----------|------|
| Super Admin | true | 拥有全部权限 |
| Operator | true | 拥有部分管理权限 |
| Viewer | true | 只读权限 |

### 2.3 初始权限列表

**Admin 操作权限（category=admin）：**
- `tasks:read`、`tasks:write`、`tasks:delete`
- `collections:read`、`collections:write`、`collections:delete`
- `users:read`、`users:write`、`users:delete`
- `roles:read`、`roles:write`（roles:delete 由 Super Admin 保留）
- `stats:view`
- `sessions:read`（查看用户 focus sessions）
- `settings:read`、`settings:write`

**Frontend 功能权限（category=frontend）：**
- `notion_sync:enable` — 启用 Notion 同步
- `focus_mode:access` — 使用 Focus Mode
- `stats:view` — 查看个人统计
- `bulk_operations:access` — 批量操作
- `export:access` — 数据导出

## 3. 模块拆分（独立可 review）

共 6 个模块，严格按依赖顺序开发：

### M1: DB Migration
**范围：** 创建 roles、permissions、role_permissions 三张表；User 表加 role_id 外键；建立索引。

**改动文件：**
- `apps/backend/migrations/xxxx_add_roles_tables.sql`
- `apps/backend/migrations/xxxx_add_role_id_to_users.sql`
- `apps/backend/models/user.go` — User 结构体加 RoleID 字段

**注意事项：**
- 迁移支持 rollback
- role_id 默认为 NULL，兼容已存在用户
- 所有非 system 的角色才可被删除

### M2: Permission 常量 & Seed
**范围：** Permission.code 枚举类型定义（Go const）；内置角色和权限的种子数据。

**改动文件：**
- `apps/backend/internal/rbac/permissions.go` — 所有 Permission.code 常量定义
- `apps/backend/internal/rbac/seed.go` — 初始化内置角色和权限
- `apps/frontend/src/types/rbac.ts` — 前端 TypeScript 类型

**注意事项：**
- Seed 只在角色/权限表为空时执行
- 内置角色（is_system=true）不可删除，名称不可修改
- 通过 DB migration 调用 seed，不单独提供 seed 命令

### M3: Auth 中间件升级
**范围：** 将 AdminMiddleware 的邮箱白名单替换为 role_id 校验；新增 `requirePermission(permCode)` 中间件。

**改动文件：**
- `apps/backend/internal/middleware/rbac.go` — 新建 RBAC 中间件
- `apps/backend/internal/middleware/auth.go` — 修改现有 Auth 中间件，加载用户角色和权限

**API 层逻辑：**
1. 从 JWT token 解析出 user_id
2. 查询 user.role_id
3. 一条 SQL 查出 role 的所有 permissions（JOIN role_permissions + permissions）
4. 缓存到 context（避免同请求内重复查询）

**路由保护：**
```
Admin 后台路由 → requirePermission('admin_*') → 检查是否有 admin_* 权限
Frontend 功能路由 → requirePermission('frontend_*') → 检查对应功能权限
```

### M4: Permission Service & Admin API
**范围：** Role、Permission、RolePermission 的 CRUD service 层；Admin 管理 API 路由。

**改动文件：**
- `apps/backend/services/role.go` — Role CRUD
- `apps/backend/services/permission.go` — Permission 只读查询
- `apps/backend/routes/admin_rbac.go` — 新路由文件
  - `GET /admin/roles` — 角色列表
  - `POST /admin/roles` — 创建角色（需 roles:write）
  - `PUT /admin/roles/:id` — 更新角色（需 roles:write）
  - `DELETE /admin/roles/:id` — 删除角色（需 roles:write，且非 system）
  - `GET /admin/roles/:id/permissions` — 获取角色权限
  - `PUT /admin/roles/:id/permissions` — 更新角色权限（需 roles:write）
  - `GET /admin/permissions` — 权限列表（只读）
  - `PUT /admin/users/:id/role` — 切换用户角色（需 users:write）

**注意事项：**
- 所有写操作需对应 permission 校验
- roles:delete 只对 is_system=false 的角色生效

### M5: Admin 前端 — 角色管理 UI
**范围：** Admin 后台的角色管理页面，包含角色列表、权限矩阵、用户角色分配。

**改动文件：**
- `apps/admin/src/routes/_authenticated/roles/index.tsx` — 角色列表页
- `apps/admin/src/routes/_authenticated/roles/$roleId.tsx` — 角色详情/权限矩阵页
- `apps/admin/src/routes/_authenticated/users/_components/users-columns.tsx` — 用户表加 role 列
- `apps/admin/src/services/admin.ts` — 新增 RBAC 相关 API 调用
- `apps/admin/src/components/layout/data/sidebar-data.ts` — 新增"角色管理"菜单项

**UI 功能：**
- 角色列表：显示内置角色（不可删除/改名），自定义角色可编辑
- 权限矩阵：以 CheckBox 表格形式展示权限，按 category 分组
- 用户管理：表格加 role 列，支持快速切换用户角色

### M6: Frontend Permission Hook & 菜单控制
**范围：** Frontend 的权限校验 hook；Sidebar 菜单按权限动态过滤。

**改动文件：**
- `apps/frontend/src/stores/permission.ts` — Zustand store，缓存当前用户 permissions
- `apps/frontend/src/hooks/use-permission.ts` — `usePermission()` hook
- `apps/frontend/src/components/bottom-nav.tsx` — 按权限过滤菜单项
- `apps/frontend/src/components/sidebar.tsx`（如有）— 同上

**usePermission API：**
```typescript
const { can, permissions, isLoading } = usePermissionStore()
// can('notion_sync:enable') → boolean
// can('focus_mode:access') → boolean
```

**权限校验策略：**
- 页面加载时，从 `/me` 或新端点获取当前用户的 permissions 列表，存入 Zustand store
- 组件内用 `can('xxx')` 判断功能入口是否显示
- API 请求层面也做校验（后端 M3 中间件），前后端双重保证

## 4. 模块依赖关系

```
M1 (DB Migration)
└── M2 (Seed)         — 依赖表结构
    ├── M3 (Middleware) — 依赖 Permission 常量
    ├── M4 (API)       — 依赖表结构 + 常量
    ├── M5 (Admin UI)  — 依赖 M4 API
    └── M6 (Frontend)   — 依赖 M1 表结构 + M3 中间件保证 API 安全
```

## 5. 安全考虑

- **前端隐藏不等于安全**：所有权限在后端 API 层（M3 中间件）做最终校验，前端 `can()` 只用于 UI 隐藏。
- **Super Admin 的界定**：第一个注册用户自动分配 Super Admin 角色。
- **迁移安全**：role_id 默认为 NULL，已存在用户需手动分配角色后才受权限控制（渐进式迁移）。
- **缓存策略**：用户权限在单次请求内通过 context 缓存，不跨请求缓存以保证实时性。

## 6. 未来扩展方向（本期不做）

- 审计日志（谁在什么时候改了谁的权限）
- 权限变更通知
- 细粒度对象级权限（如限制 Operator 只能看特定用户的数据）
- 多语言化
