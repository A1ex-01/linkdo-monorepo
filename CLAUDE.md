# CLAUDE.md

## 项目概述

Link-Do 是一款 macOS 桌面端任务管理与专注计时工具。通过 Notion 同步实现数据持久化，支持三种窗口形态无缝切换。

技术栈：Tauri 2 + React 19 + Tailwind CSS + Zustand + Next.js App Router

---

## 前端项目 /frontend

### 项目结构

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 根页面 (重定向到 /home 或 /work)
│   ├── home/              # 首页路由 /home
│   │   └── page.tsx
│   └── work/              # 工作/看板路由 /work
│       └── page.tsx
├── components/             # React 组件
│   └── theme-provider.tsx
├── config/                 # 配置文件
│   └── index.ts
├── lib/                    # 工具函数
│   └── utils.ts
├── providers/              # React Providers
│   └── base.tsx
├── services/               # API 服务层
│   ├── base.ts            # API 基类
│   └── client-request.ts  # HTTP 客户端
├── styles/                # 全局样式
├── types/                 # TypeScript 类型定义
│   └── base.ts
└── utils/                 # 工具函数
    └── base.ts
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

## 后端项目

待补充
