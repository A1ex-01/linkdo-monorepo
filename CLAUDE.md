# CLAUDE.md

项目背景：Link-Do 是一款 macOS 桌面端任务管理与专注计时工具。通过 Notion 同步实现数据持久化，支持三种窗口形态无缝切换。技术栈：Tauri 2 + React 19 + Tailwind CSS + Zustand + Next.js App Router + Go + Python + MCP。

---

## 项目概述

Link-Do 是一款 macOS 桌面端任务管理与专注计时工具。通过 Notion 同步实现数据持久化，支持三种窗口形态无缝切换。

技术栈：Tauri 2 + React 19 + Tailwind CSS + Zustand + Next.js App Router + Go + Python + MCP

---

## Harness Rules (MANDATORY)

This project uses `harness/` engineering standards. Rules below are auto-effective per session.

### Pre-task Checklist

Before any **non-trivial** task, you MUST:

1. Read `harness/project.profile.md` and `harness/context-map.md`
2. Route the task using the table below, declare the route
3. Follow the corresponding runbook, write artifacts to `.ai-runtime-artifacts/`

### Routing Table

| Task Type | Route | Artifact Dir |
|-----------|-------|--------------|
| Requirements / Design / Behavior Change | `superpowers:brainstorming` | `.ai-runtime-artifacts/specs/` |
| Implementation Plan | `superpowers:writing-plans` | `.ai-runtime-artifacts/plans/` |
| Multi-task Coding / Parallel Impl | `superpowers:subagent-driven-development` | `.ai-runtime-artifacts/execution-logs/` + code changes |
| Code Review / Verification | `superpowers:verification-before-completion` | `.ai-runtime-artifacts/verifications/` |
| Bug Investigation | `superpowers:systematic-debugging` | `.ai-runtime-artifacts/verifications/` |
| Architecture Decision | architect / critic / planner | `.ai-runtime-artifacts/decisions/` |
| Trivial Change / Single-file Mechanical Edit | Handle directly | No artifact needed |

### "Trivial Change" Criteria

The following are **NOT** trivial — MUST produce artifacts:

- Code review or diff analysis involving 3+ files
- User explicitly asks to "审核", "review", or "check" code quality
- Verification step at the end of an implementation flow (even if user doesn't say "verify")
- Analysis requiring cross-module understanding

### Runbook Summary

**New Feature:** spec (specs/) → plan decision (write plan if complex, skip otherwise) → coding (superpowers:subagent-driven-development) → execution-log (execution-logs/) → verification (verifications/)

**Bug Fix:** root cause → fix (superpowers:systematic-debugging → direct fix) → execution-log (execution-logs/) → verification (verifications/)

**Architecture Decision:** compare options → decision record (decisions/), MUST include accepted/rejected options, constraints, and risks

### Artifact Format

Every artifact file MUST start with YAML front matter containing: `artifact`, `route`, `skills`, `source`, `created_at`. See `harness/core/artifacts.md`.

### Constraints

- **MANDATORY declaration (every task):** First line of response MUST be `「Harness：<route or "小改动，直接处理">」`. This proves routing was evaluated. For trivial tasks, print declaration then proceed directly.
- **User intervention when undeclared:** If AI response does not start with `「Harness：...」`, the rules were not loaded. User should send: `请先读取 CLAUDE.md 和 harness/core/routing.md，按 harness 规范重新处理我的上一个请求。`
- Before non-trivial tasks, declare route, skills, and source
- Any completion claim MUST have verification evidence
- Default route is mandatory baseline; user-specified skills are additive, not replacement

---

## 前端项目 /apps/frontend

### 项目结构

```
apps/frontend/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 根页面 (重定向到 /home 或 /work)
│   ├── home/              # 首页路由 /home
│   │   └── page.tsx
│   └── work/              # 工作/看板路由 /work
│       └── page.tsx
├── components/             # React 组件
├── config/                 # 配置文件
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具函数 (cn 等)
├── providers/              # React Providers
├── services/               # API 服务层 (base.ts, client-request.ts)
├── stores/                 # Zustand 状态管理
├── styles/                 # 全局样式
├── types/                  # TypeScript 类型定义
└── utils/                  # 工具函数
```

### 命名规范

- 文件命名：kebab-case（如 `client-request.ts`、`theme-provider.tsx`）
- 组件命名：PascalCase（如 `ThemeProvider`、`CollectionCard`）
- 目录命名：kebab-case
- 不要使用 CamelCase 或 PascalCase 命名文件和目录

### TypeScript

- 使用最新稳定版 TypeScript
- 所有组件使用明确的 TypeScript 类型
- 避免使用 `any`，优先使用 `unknown` + 类型守卫

### UI 和样式

- 使用 Tailwind CSS 进行样式开发
- 使用 Shadcn UI 组件库
- 响应式设计，移动优先
- 深色模式支持

### 状态管理

- 使用 Zustand 管理 UI 状态
- Store 文件放在对应功能目录下
- 业务数据通过 API 获取，不做本地持久化

### API 调用规范

使用 ahooks 的 `useRequest` 管理数据获取：

**需要使用 useRequest 的场景：**
- 获取 xx 信息
- 获取 xx 列表
- 新建 xx

```typescript
const { data, loading, run } = useRequest(
  async () => {
    const res = await xxx({ params });
    return res?.data;
  },
  {
    manual: true,
    refreshDeps: [uuid],
  }
);
```

**不需要使用 useRequest 的场景：**
- 删除 xx
- 更新 xx

删除和更新操作不需要写 `onSuccess` 和 `onError`。

### 时间格式化

使用 `dayjs` 格式化时间，不要使用原生 Date 方法。

### 其他规范

- 不要删除 debug 用的 `console.log`
- 出现错误时，不要删除错误处理代码
- 优先使用 ahooks 提供的 hooks
- 最终代码不检查 lint 错误

---

详细规范参见：`harness/core/routing.md`、`harness/core/artifacts.md`、`harness/core/runbooks.md`、`harness/core/verification.md`。

若本文件与 `AGENTS.md` 有冲突，以 `AGENTS.md` 为准。
