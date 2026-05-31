---
generated_at: 2026-05-31
generator: harness-init
---

# Project Verification — Link-Do

本文件描述当前项目的验证命令。

## Harness 验证

```bash
bash harness/scripts/harness-check.sh
```

## 应用验证

| 命令 | 用途 |
|------|------|
| `make dev-frontend` | 启动 Tauri 桌面端（验证前端构建） |
| `make dev-admin` | 启动管理后台 |
| `make dev-mcp` | 启动 MCP Server |
| `pnpm --filter @link-do/frontend build` | 构建前端生产包 |
| `pnpm --filter @link-do/admin build` | 构建管理后台 |

## 静态检查

| 命令 | 用途 |
|------|------|
| `make lint` | pnpm -r lint（所有 JS/TS 包） |
| `make typecheck` | pnpm -r typecheck（所有 JS/TS 包） |
| `bash -n services/backend/main.go` | Go 语法检查 |

## 待确认项

- services/backend 是否有独立的 lint / test 脚本
- services/agent 是否有测试或 lint 命令
- 各子包是否已配置 lint-staged / husky 钩子
