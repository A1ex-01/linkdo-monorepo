# Link-Do

> macOS 桌面端任务管理与专注计时工具。通过 Notion 同步实现数据持久化，支持三种窗口形态无缝切换。

**技术栈**: Tauri 2 + React 19 + Next.js App Router + Tailwind CSS + Zustand + Go + Python + MCP

---

## 项目结构

```
.
├── apps/               # JS/TS 应用（pnpm workspace 管理）
│   ├── frontend/       # Tauri + Next.js 桌面端
│   ├── admin/          # Ant Design Pro 管理后台
│   └── mcp/            # Node.js MCP Server
├── services/           # 后端服务（各自独立的包管理器）
│   ├── backend/        # Go 服务
│   └── agent/          # Python Agent 服务
├── packages/           # JS/TS 共享包
│   └── shared/         # 公共类型、工具函数、常量
├── docs/               # 项目文档
└── design/             # 设计稿
```

## 开发指南

### 环境要求

- Node.js >= 18
- pnpm >= 9
- Go >= 1.21
- Python >= 3.11 + uv

### 安装依赖

```bash
# 安装所有 JS/TS 依赖
pnpm install
```

### 启动开发

```bash
# 启动所有服务
make dev

# 单独启动
make dev-frontend    # Tauri 桌面端
make dev-admin       # 管理后台
make dev-mcp         # MCP Server
make dev-backend     # Go 服务
make dev-agent       # Python Agent
```

---

## 架构概览

```
┌──────────────────────────────────────────┐
│           macOS Desktop App               │
│           (Tauri 2 Runtime)               │
│  ┌────────────────────────────────────┐  │
│  │   React 19 + Next.js 15 Frontend  │  │
│  │   (窗口状态管理 / 计时器 / 看板)    │  │
│  └────────────────────────────────────┘  │
└──────────────────┬───────────────────────┘
                   │ HTTP API
                   ▼
┌──────────────────────────────────────────┐
│         Go API Server (Iris)              │
│  Notion OAuth / MySQL / Redis / JWT      │
└──────────┬─────────────────┬────────────┘
           │                 │
           ▼                 ▼
┌──────────────────┐  ┌──────────────────────┐
│   Notion API     │  │
│   (数据持久化)    │  │   Vercel AI SDK      │
└──────────────────┘  │   DeepSeek Chat API  │
                     └──────────────────────┘

┌──────────────────────────────────────────┐
│          MCP Server (TypeScript)          │
│  Model Context Protocol — AI 工具调用    │
│  集成到 Cursor / Claude Desktop           │
└──────────────────┬───────────────────────┘
                   │ MCP 工具调用
                   ▼
┌──────────────────────────────────────────┐
│         Agent Server (Python)             │
│  FastAPI / LangChain / DeepSeek           │
│  AI Agent 智能任务管理与自动执行          │
└──────────────────────────────────────────┘
```

---

## 各子模块详情

### Frontend — `apps/frontend/`

macOS 桌面端应用，Tauri 2 + React 19 构建。

```bash
make dev-frontend
# 或
pnpm --filter @link-do/frontend dev
```

**主要依赖**: Next.js 15, Tailwind CSS, Zustand, ahooks, Shadcn UI, Radix UI, React Hook Form + Zod, dayjs, Framer Motion, @tabler/icons-react, Vercel AI SDK

**窗口形态**:

| 形态 | 窗口宽度 | Always on Top | 说明 |
|------|---------|---------------|------|
| 标准视图 | ~1440px | 否 | Collection 列表 / 看板 |
| 计时模式 | 343px | 可选 | 窄屏计时，实时 HH:MM:SS |
| 胶囊 Focus | ~343×48px | **是** | 胶囊悬浮窗，常驻最前 |

### Backend — `services/backend/`

Go RESTful API 服务，处理业务逻辑、Notion OAuth 同步、JWT 鉴权。

```bash
make dev-backend
# 或
cd services/backend && go run main.go
```

**主要依赖**: Iris v12, GORM, MySQL, Redis, JWT, Notion API SDK, Gomail（邮件）

**核心服务**:

- `auth` — JWT + Notion OAuth 2.0 登录
- `collection` — 任务集合管理
- `task` — 任务 CRUD，与 Notion 双向同步
- `timer` — 计时会话管理
- `notion-sync` — Notion 数据库状态映射与同步
- `email` — 邮件通知

**环境变量**（`.env`）:

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端口，默认 `8080` |
| `MYSQL_DSN` | MySQL 连接字符串 |
| `REDIS_ADDR` | Redis 地址 |
| `NOTION_CLIENT_ID` | Notion OAuth Client ID |
| `NOTION_CLIENT_SECRET` | Notion OAuth Client Secret |
| `NOTION_TOKEN_ENCRYPTION_KEY` | Base64 编码的 32 字节 AES-256-GCM 密钥；仅放在部署 Secret 中，使用 `openssl rand -base64 32` 生成 |
| `JWT_SECRET` | JWT 签名密钥 |

### Admin — `apps/admin/`

Ant Design Pro 管理后台。

```bash
make dev-admin
# 或
pnpm --filter @link-do/admin dev
```

### MCP Server — `apps/mcp/`

Model Context Protocol 服务器，将 Link-Do 任务管理能力暴露给 Cursor、Claude Desktop 等 AI 助手。

```bash
make dev-mcp
# 或
pnpm --filter @link-do/mcp dev
```

**认证**: 通过 Link-Do 后端 OAuth 2.0 完成用户鉴权，无需单独注册 API Token。

**可用工具**:

| 工具 | 说明 |
|------|------|
| `get_collections` | 列出所有 Collection |
| `get_todos` | 获取任务列表（按状态分组，最多 100 条） |
| `create_todo` | 创建新任务 |
| `update_todo` | 更新任务标题、时间或状态 |
| `delete_todo` | 删除任务 |

**Claude Desktop 配置** 参见 [`apps/mcp/README.md`](apps/mcp/README.md)。

### Agent — `services/agent/`

AI Agent 服务，通过 MCP 工具操作用户任务数据，支持两阶段确认执行、流式 SSE 输出。

```bash
make dev-agent
# 或
cd services/agent && uv run python -m app.main
```

**主要依赖**: FastAPI, LangChain, DeepSeek SDK, SSE（流式输出）

**环境变量**:

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `AGENT_API_KEY` | API 认证密钥（必填） | `""` |
| `LLM_API_KEY` | LLM API Key | `""` |
| `LLM_BASE_URL` | LLM API 地址 | `https://api.deepseek.com` |
| `LLM_MODEL` | 模型名称 | `deepseek-chat` |
| `AGENT_MCP_SERVER_COMMAND` | MCP Server 启动命令 | `["npx", "-y", "@modelcontextprotocol/server-filesystem", "/tmp"]` |
| `AGENT_MCP_SERVER_CWD` | MCP 工作目录 | `/tmp` |

**接口**:

| 接口 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `POST /v1/chat/stream` | 流式对话（两阶段确认或直接执行） |
| `POST /v1/chat/confirm` | 两阶段确认第二步：用户确认后继续执行 |

**SSE 事件流（confirm=true 两阶段）**：

1. `confirm` 事件 → 返回执行计划，前端展示给用户确认
2. 前端调用 `POST /v1/chat/confirm?session_id=xxx` 确认
3. `execute_start` → `text` → `done` 事件流

**SSE 事件流（confirm=false 直接执行）**：

直接输出 `execute_start` → `text` → `done`

---

## 用户核心流程

```
OAuth 授权 → 创建 Collection → 关联 Notion DB
→ 设置状态映射 → 创建/管理任务 → 开始计时
→ 切换窗口形态（标准 → 窄屏 → 胶囊 Focus）
→ 完成任务 → Notion 自动同步
```

状态枚举：`backlog` → `this_week` → `today` → `done`

---

## 设计资源

- `design/` — 产品界面截图、设计参考图
- `docs/product-specs/PRD.md` — 完整产品需求文档

---

## License

待定
