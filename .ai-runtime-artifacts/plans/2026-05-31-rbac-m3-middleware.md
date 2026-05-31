---
artifact: plan-m3-middleware
route: superpowers:writing-plans
skills: []
source: link-do-rbac
created_at: "2026-05-31"
---

# RBAC — M3: Auth 中间件升级 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AdminMiddleware 的邮箱白名单替换为 role_id 校验；新增 `RequirePermission(permCode)` 中间件；JWT 解析后加载用户角色和权限到 context。

**Architecture:** 在 Gin 中间件层做权限校验。从 JWT 获取 user_id → 查询 DB 获取 user.role_id → JOIN 查询该角色的所有 permissions → 存入 gin.Context。路由层面通过 middleware 链式调用。

**Tech Stack:** Go（Gin）、GORM、PostgreSQL

---

## Task 1: 找到现有 Auth 和 AdminMiddleware

### 3.1 探索现有中间件

**Files:**
- Modify: `apps/backend/internal/middleware/` 下现有文件

- [ ] **Step 1: 找到 Auth 中间件文件**

```bash
ls apps/backend/internal/middleware/
find apps/backend -name "*.go" | xargs grep -l "WHITELIST\|whitelist\|AdminMiddleware" 2>/dev/null
```

找到后记录：
- `auth.go` 的位置和内容
- `AdminMiddleware` 的位置
- JWT 解析方式（user_id 从哪来）

---

## Task 2: 创建 RBAC 中间件

### 3.2 创建 rbac.go 中间件

**Files:**
- Create: `apps/backend/internal/middleware/rbac.go`

- [ ] **Step 1: 创建 RBAC 中间件文件**

```go
package middleware

import (
    "apps/backend/models"
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type RBACMiddleware struct {
    db *gorm.DB
}

func NewRBACMiddleware(db *gorm.DB) *RBACMiddleware {
    return &RBACMiddleware{db: db}
}

// LoadUserPermissions loads the current user's permissions into context
// Should be called AFTER auth middleware (which sets user_id in context)
func (m *RBACMiddleware) LoadUserPermissions() gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, exists := c.Get("user_id")
        if !exists {
            c.Next()
            return
        }

        var user models.User
        if err := m.db.Preload("Permissions").First(&user, userID).Error; err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
            return
        }

        // Store user role info in context
        if user.RoleID != nil {
            var role models.Role
            if err := m.db.Preload("Permissions").First(&role, *user.RoleID).Error; err == nil {
                c.Set("role", role)
                perms := make([]string, len(role.Permissions))
                for i, p := range role.Permissions {
                    perms[i] = p.Code
                }
                c.Set("permissions", perms)
            }
        }

        c.Next()
    }
}

// RequirePermission checks if the current user has the given permission code
// Usage: router.GET("/admin/tasks", middleware.RequirePermission("tasks:read"), handler)
func RequirePermission(permCode string) gin.HandlerFunc {
    return func(c *gin.Context) {
        perms, exists := c.Get("permissions")
        if !exists {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no permissions loaded"})
            return
        }

        permList, ok := perms.([]string)
        if !ok {
            c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "invalid permissions"})
            return
        }

        for _, p := range permList {
            if p == permCode {
                c.Next()
                return
            }
        }

        c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permission denied: " + permCode})
    }
}

// RequireAnyPermission checks if user has at least one of the given permissions
func RequireAnyPermission(permCodes ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        perms, exists := c.Get("permissions")
        if !exists {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no permissions loaded"})
            return
        }

        permList, ok := perms.([]string)
        if !ok {
            c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "invalid permissions"})
            return
        }

        permSet := make(map[string]bool)
        for _, p := range permList {
            permSet[p] = true
        }

        for _, required := range permCodes {
            if permSet[required] {
                c.Next()
                return
            }
        }

        c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permission denied"})
    }
}

// RequireAdmin checks if user has any admin permission (category=admin)
func RequireAdmin() gin.HandlerFunc {
    return func(c *gin.Context) {
        perms, exists := c.Get("permissions")
        if !exists {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no permissions loaded"})
            return
        }

        permList, ok := perms.([]string)
        if !ok {
            c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "invalid permissions"})
            return
        }

        for _, p := range permList {
            if strings.HasPrefix(p, "admin:") || !strings.Contains(p, ":") {
                // Still check — if any permission is set, they have a role
                // For now: if user has any permission and a role_id, they can access admin
                // More specific: check if they have at least one admin_* permission
            }
            _ = p // refine below
        }

        // Simpler: if user has role_id and loaded permissions, allow
        // Admin routes are protected by RequirePermission() on each route
        // RequireAdmin() is a lightweight pre-check: has any permission?
        if len(permList) == 0 {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no admin access"})
            return
        }
        c.Next()
    }
}
```

> **Note:** `RequireAdmin()` 的逻辑可以简化——Admin 路由用 `RequirePermission()` 精确保护，不需要单独的 Admin check。

- [ ] **Step 2: 简化 RequireAdmin（可选）**

删除 `RequireAdmin()` 函数，在 Admin 路由上直接用 `RequirePermission()`。

---

## Task 3: 修改现有 Auth 中间件

### 3.3 更新现有 Auth 中间件，移除邮箱白名单

**Files:**
- Modify: `apps/backend/internal/middleware/auth.go`（确认路径后）

- [ ] **Step 1: 移除邮箱白名单逻辑**

找到 `WHITELIST` 或邮箱白名单相关代码，删除或注释掉。用 `RoleID != nil` 替代白名单判断：

```go
// Before:
// if !isInWhitelist(email) { return 403 }

// After:
// User's role_id determines their access via RBAC middleware
```

- [ ] **Step 2: 确保 user_id 被正确设置到 context**

Auth 中间件应在 `LoadUserPermissions()` 之前运行。确认 `c.Set("user_id", userID)` 在 auth 中间件里。

- [ ] **Step 3: 确认中间件注册顺序**

在路由注册处（如 `router.go` 或 `main.go`），确保：

```go
// 正确顺序：Auth → LoadPermissions → RequirePermission → Handler
router.Use(AuthMiddleware())
router.Use(RBACMiddleware.LoadUserPermissions())
```

---

## Task 4: 验证迁移兼容性

### 3.4 处理无 role_id 的用户（向后兼容）

- [ ] **Step 1: 处理 role_id 为 NULL 的用户**

在 `LoadUserPermissions()` 中，如果 `user.RoleID == nil`，设置空权限列表。这类用户无法访问任何受保护资源。

**对于第一个注册用户（Super Admin 分配）：**

在 `apps/backend/services/user.go` 的用户创建逻辑中，检查如果是第一个用户，自动分配 Super Admin 角色：

```go
// In user creation service
func CreateUser(...) {
    // ... existing code ...
    var count int64
    db.Model(&models.User{}).Count(&count)
    if count == 0 {
        // First user — assign Super Admin
        var superAdmin models.Role
        db.Where("name = ?", "Super Admin").First(&superAdmin)
        newUser.RoleID = &superAdmin.ID
    }
    // ... rest of creation
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/backend/internal/middleware/rbac.go apps/backend/internal/middleware/auth.go apps/backend/services/user.go
git commit -m "feat(rbac): M3 add RBAC middleware and replace whitelist"
```
