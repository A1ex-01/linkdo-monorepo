---
generated_at: 2026-05-31
generator: harness-init
---

# Project Profile — Link-Do

本文件是当前项目画像，不是通用 Harness 模板。迁移到其他项目时，必须让 AI 通过 `harness/init/project-profiler.prompt.md` 重新生成。

## 项目身份

- **名称**: Link-Do
- **类型**: macOS 桌面端任务管理与专注计时工具
- **定位**: 通过 Notion 同步实现数据持久化，支持三种窗口形态无缝切换
- **平台**: macOS Desktop (Tauri 2 Runtime)

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面运行时 | Tauri 2 |
| 前端框架 | React 19 + Next.js 15 App Router |
| UI 样式 | Tailwind CSS + Shadcn UI + Radix UI |
| 状态管理 | Zustand |
| 数据请求 | ahooks (useRequest) |
| 表单验证 | React Hook Form + Zod |
| 图标库 | @tabler/icons-react |
| AI SDK | Vercel AI SDK |
| 后端语言 | Go (Iris v12) + Python (FastAPI) |
| 数据库 | MySQL (GORM) |
| 缓存 | Redis |
| 认证 | JWT + Notion OAuth 2.0 |
| AI 服务 | DeepSeek Chat API |
| 协议 | MCP (Model Context Protocol) |
| 包管理 | pnpm workspace |

## 主要目录

| 路径 | 职责 |
|------|------|
| `apps/frontend/` | Tauri + Next.js 桌面端，React 19 三种窗口形态 |
| `apps/admin/` | Ant Design Pro 管理后台 |
| `apps/mcp/` | Node.js MCP Server，AI 工具调用接口 |
| `services/backend/` | Go RESTful API (Iris)，业务逻辑、Notion 同步、JWT 鉴权 |
| `services/agent/` | Python FastAPI Agent，LangChain + DeepSeek，流式 SSE |
| `packages/shared/` | JS/TS 共享类型、工具函数、常量 |
| `harness/` | Agent Harness 工程规范脚手架 |
| `docs/` | 项目文档 |
| `design/` | 设计稿 |

## 窗口形态

| 形态 | 窗口宽度 | Always on Top | 说明 |
|------|---------|---------------|------|
| 标准视图 | ~1440px | 否 | Collection 列表 / 看板 |
| 计时模式 | 343px | 可选 | 窄屏计时，实时 HH:MM:SS |
| 胶囊 Focus | ~343×48px | **是** | 胶囊悬浮窗，常驻最前 |

## 任务状态枚举

`backlog` → `this_week` → `today` → `done`

## 交付口径

- 所有前端组件使用 TypeScript 明确类型
- API 调用通过 `services/` 层封装，使用 ahooks useRequest
- Zustand 管理 UI 状态，业务数据通过 API 获取不做本地持久化
- 文件命名严格使用 kebab-case，组件使用 PascalCase
- 不检查 lint 错误

## 推断项

- 三种窗口形态由前端 React 控制窗口尺寸和 alwaysOnTop 状态
- Notion 同步通过 Go 后端的 `notion-sync` 服务实现双向映射
- MCP Server 暴露 get_collections、get_todos、create_todo、update_todo、delete_todo 五个工具
- Python Agent 通过两阶段确认（confirm=true）实现用户交互，流式 SSE 输出
- pnpm workspace 管理 apps/* 和 packages/*，各子包独立 package.json

## 待确认项

以下信息无法从公开代码中确认，请 review：

1. **Agent 服务接入状态**：services/agent 是否已接入生产 DeepSeek API？
2. **MySQL / Redis 配置**：连接字符串通过 `.env` 管理，是否已加入 `.gitignore`？
3. **Notion OAuth**：应用注册和回调 URL 配置是否已完成？
4. **Admin 后台进度**：apps/admin 当前开发完成度如何？
5. **packages/shared/**：`packages/shared/` 是否已有实质代码，或仍为空目录？
6. **services/backend 脚本**：services/backend 是否有独立的 lint 或 test 命令？
