---
generated_at: 2026-05-31
generator: harness-init
---

# Context Map — Link-Do

本文件由 Harness 初始化流程生成，用于帮助 AI 快速理解项目结构。

## 顶层结构

```
a-link-do/              # pnpm workspace 根目录
├── apps/               # JS/TS 应用（pnpm workspace 管理）
│   ├── frontend/       # Tauri 2 + Next.js 15 桌面端
│   ├── admin/          # Ant Design Pro 管理后台
│   └── mcp/            # Node.js MCP Server
├── services/           # 后端服务（独立包管理器）
│   ├── backend/        # Go 服务 (Iris + GORM)
│   └── agent/          # Python Agent (FastAPI + LangChain)
├── packages/           # JS/TS 共享包
│   └── shared/         # 公共类型、工具函数、常量
├── harness/           # Agent Harness 工程规范
├── .ai-runtime-artifacts/  # AI 过程产物
├── docs/              # 项目文档
└── design/            # 设计稿
```

## 主要入口

| 入口 | 说明 |
|------|------|
| `make dev` | 并行启动所有服务 |
| `make dev-frontend` | 启动 Tauri 桌面端 (apps/frontend) |
| `make dev-admin` | 启动管理后台 (apps/admin) |
| `make dev-mcp` | 启动 MCP Server (apps/mcp) |
| `make dev-backend` | 启动 Go API (services/backend) |
| `make dev-agent` | 启动 Python Agent (services/agent) |

## 关键模块

### apps/frontend — 桌面端前端

| 模块 | 路径 | 说明 |
|------|------|------|
| Next.js App Router | `apps/frontend/src/app/` | /home、/work 路由 |
| 组件 | `apps/frontend/src/components/` | 共享组件 |
| 状态 | `apps/frontend/src/stores/` | Zustand stores |
| API | `apps/frontend/src/services/` | HTTP 请求封装 |
| Hooks | `apps/frontend/src/hooks/` | 自定义 hooks |
| Providers | `apps/frontend/src/providers/` | React providers (Theme, Toast) |

### apps/admin — 管理后台

| 模块 | 路径 | 说明 |
|------|------|------|
| 路由 | `apps/admin/src/routes/` | WXT 路由 |
| 组件 | `apps/admin/src/components/` | 业务组件 |
| 状态 | `apps/admin/src/stores/` | Zustand stores |
| 服务 | `apps/admin/src/services/` | API 调用层 |
| TanStack Table | `apps/admin/src/hooks/` | 表格管理 |

### apps/mcp — MCP Server

| 模块 | 路径 | 说明 |
|------|------|------|
| 工具定义 | `apps/mcp/src/tools/` | 5 个 MCP 工具实现 |
| 类型 | `apps/mcp/src/types.ts` | 工具输入输出类型 |
| 入口 | `apps/mcp/src/index.ts` | MCP Server 启动 |

### services/backend — Go API

| 模块 | 说明 |
|------|------|
| auth | JWT + Notion OAuth 2.0 登录 |
| collection | 任务集合管理 |
| task | 任务 CRUD，与 Notion 双向同步 |
| timer | 计时会话管理 |
| notion-sync | Notion 数据库状态映射与同步 |
| email | 邮件通知（Gomail） |

### services/agent — Python Agent

| 模块 | 说明 |
|------|------|
| app/main.py | FastAPI 入口，/health、/v1/chat/stream、/v1/chat/confirm |
| 流式 SSE | execute_start → text → done 事件流 |
| 两阶段确认 | confirm=true 时先返回执行计划，等用户确认 |

## 服务间关系

```
macOS Desktop (Tauri)
  ├─ React 19 Frontend (apps/frontend) ── HTTP ──► Go Backend (services/backend)
  │                                                     ├─ MySQL / Redis
  │                                                     └─ Notion API
  ├─ MCP Server (apps/mcp) ── MCP ──────────────────► Cursor / Claude Desktop
  │                                                     └─► Python Agent (services/agent)
  │                                                              └─ DeepSeek API
  └─ Admin (apps/admin) ── HTTP ────────────────────► Go Backend
```

## 待确认项

- services/backend 的具体 API 路由定义和端口
- apps/mcp 与 services/agent 的实际连接方式（HTTP？进程间通信？）
- packages/shared 当前是否已有实质代码
