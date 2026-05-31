---
artifact: plan-m1-db-migration
route: superpowers:writing-plans
skills: []
source: link-do-rbac
created_at: "2026-05-31"
---

# RBAC — M1: DB Migration 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 roles、permissions、role_permissions 三张表；在 users 表加 role_id 外键字段。

**Architecture:** 在 PostgreSQL 中新建三张表，通过 GORM migration 管理。users.role_id 默认为 NULL 以兼容已存在用户。所有表加索引确保查询性能。

**Tech Stack:** Go（GORM）、PostgreSQL、Goose migration

---

## 前置准备

先确认现有 migration 工具和目录结构。

### 1.1 确认 Migration 工具

**Files:**
- Modify: `apps/backend/Makefile` 或 `apps/backend/migrations/` 目录

- [ ] **Step 1: 确认 migration 工具**

检查项目使用的 migration 工具：
```bash
ls apps/backend/migrations/
cat apps/backend/Makefile | grep -i migrat
```

如果用 Goose，看 `apps/backend/db/migrate/` 或 `migrations/` 目录下的 `.sql` 或 `.go` 文件。
如果用 GORM AutoMigrate，改为手写 SQL migration 文件以保证可回滚。

确认后记录工具类型（Goose/GORM/SQL）。

---

## Task 1: 创建 Roles 表

### 1.2 创建 Migration 文件

**Files:**
- Create: `apps/backend/migrations/YYYYMMDDHHMMSS_create_roles_table.sql`

- [ ] **Step 1: 创建 roles 表 migration 文件**

```sql
-- Migration: Create roles table
-- Up
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Down
DROP TABLE IF EXISTS roles;
```

- [ ] **Step 2: 运行 migration**

```bash
cd apps/backend && make migrate-up
# 或
goose postgres "host=localhost port=5432 user=xxx dbname=xxx password=xxx sslmode=disable" up
```

确认输出包含 `OK    YYYYMMDDHHMMSS_create_roles_table.sql`。

---

## Task 2: 创建 Permissions 表

### 1.3 创建 Permissions 表 Migration

**Files:**
- Create: `apps/backend/migrations/YYYYMMDDHHMMSS_create_permissions_table.sql`

- [ ] **Step 1: 创建 permissions 表 migration 文件**

```sql
-- Migration: Create permissions table
-- Up
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,  -- 'admin' 或 'frontend'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Down
DROP TABLE IF EXISTS permissions;
```

- [ ] **Step 2: 运行 migration**

```bash
cd apps/backend && make migrate-up
```

---

## Task 3: 创建 RolePermissions 映射表

### 1.4 创建 RolePermissions 表 Migration

**Files:**
- Create: `apps/backend/migrations/YYYYMMDDHHMMSS_create_role_permissions_table.sql`

- [ ] **Step 1: 创建 role_permissions 表 migration 文件**

```sql
-- Migration: Create role_permissions mapping table
-- Up
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Down
DROP TABLE IF EXISTS role_permissions;
```

- [ ] **Step 2: 运行 migration**

```bash
cd apps/backend && make migrate-up
```

---

## Task 4: User 表加 role_id 字段

### 1.5 修改 Users 表 Migration

**Files:**
- Create: `apps/backend/migrations/YYYYMMDDHHMMSS_add_role_id_to_users.sql`

- [ ] **Step 1: 创建 add role_id to users migration 文件**

```sql
-- Migration: Add role_id to users table
-- Up
ALTER TABLE users ADD COLUMN role_id BIGINT REFERENCES roles(id);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Down
ALTER TABLE users DROP COLUMN IF EXISTS role_id;
```

- [ ] **Step 2: 运行 migration**

```bash
cd apps/backend && make migrate-up
```

---

## Task 5: 修改 User Model

### 1.6 更新 User Go Model

**Files:**
- Modify: `apps/backend/models/user.go`（或对应 User model 文件）

- [ ] **Step 1: 在 User 结构体中加 RoleID 字段**

找到 User 结构体，在字段列表中添加：

```go
type User struct {
    ID        int64     `json:"id" gorm:"primaryKey;autoIncrement"`
    Email     string    `json:"email" gorm:"uniqueIndex;size:255;not null"`
    Name      string    `json:"name" gorm:"size:255"`
    Password  string    `json:"-" gorm:"size:255"`
    RoleID    *int64    `json:"role_id" gorm:"index"`  // 新增，nullable
    // ... 其他现有字段
}
```

- [ ] **Step 2: 确认 RoleID 字段 JSON tag 正确**

`json:"role_id"` 和 `gorm:"index"` 必须存在。

- [ ] **Step 3: 提交**

```bash
cd apps/backend && git add migrations/ models/user.go
git commit -m "feat(rbac): M1 add roles/permissions tables and user.role_id"
```
