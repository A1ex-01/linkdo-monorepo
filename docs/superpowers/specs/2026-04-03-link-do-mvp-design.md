# Link-Do MVP 设计规格

> **日期**: 2026-04-03
> **版本**: v1.0
> **状态**: 已批准

---

## 1. 概述

Link-Do 是一款 macOS 桌面端任务管理与专注计时工具。通过 Notion 同步实现数据持久化，支持三种窗口形态无缝切换——全功能列表视图、窄屏计时视图、沉浸式胶囊悬浮窗。

### 1.1 关键决策


| 决策项   | 选择                                                                         | 理由                           |
| ----- | -------------------------------------------------------------------------- | ---------------------------- |
| 架构模式  | 后端驱动 + 前端展示层                                                               | Go API 承担全部业务逻辑，前端专注 UI      |
| 前端技术栈 | Tauri 2 + React 19 + Tailwind + Zustand                                    | 桌面端主流组合                      |
| 路由    | React Router (MemoryRouter)                                                | 桌面端无需 URL 路由，MemoryRouter 够用 |
| 计时器   | 前端 Zustand 运行计时器（setInterval），start/stop 时调 API 写入 Notion，每 5 分钟从 API 校准时长 | 简单可靠，关闭应用丢失未保存的计时            |
| 认证    | 系统浏览器 OAuth + deep link 回调                                                 | 桌面端 OAuth 最佳实践               |
| 持久化   | Notion 为唯一存储，Go 内存缓存，无离线                                                   | 简化架构，MVP 够用                  |
| 窗口    | 严格按 PRD 三态（标准/窄屏/胶囊 always-on-top）                                         | 产品核心差异化                      |


---

## 2. 系统架构

```
┌─────────────────────────────────────────────┐
│              Tauri 2 Desktop App             │
│  ┌───────────────────────────────────────┐  │
│  │     React + Tailwind 前端 (展示层)      │  │
│  │  • MemoryRouter 视图切换               │  │
│  │  • Zustand — 仅 UI 状态 + 本地计时     │  │
│  │  • 每 5 分钟从 API 校准计时时长         │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │           Tauri Rust 层                │  │
│  │  • 窗口三态管理                        │  │
│  │  • 系统浏览器启动 OAuth                │  │
│  │  • Deep link 回调接收 token            │  │
│  │  • 胶囊拖拽 (startDragging)            │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                      │ HTTP
                      ▼
           ┌─────────────────────┐
           │     Go API Server    │
           │  • 全部业务逻辑       │
           │  • Notion OAuth 代理  │
           │  • 双向同步           │
           │  • 内存缓存           │
           └─────────────────────┘
                      │ HTTPS
                      ▼
              ┌──────────────┐
              │  Notion API   │
              └──────────────┘
```

### 2.1 数据流

- **写操作**: 用户操作 → React UI → HTTP Request → Go API (Service) → Notion API → 更新内存缓存 → 返回响应
- **读操作**: React UI → HTTP Request → Go API → 内存缓存（优先）→ 若为空则 Notion API 拉取 → 返回响应
- **计时**: 前端 Zustand setInterval 每秒 +1 显示 → start/stop 时调 API 记录 → 每 5 分钟 GET /api/v1/timer/current 校准累计时长

---

## 3. Go API 接口设计

所有 `/api/v1/`* 接口（除 auth 相关）需要 `Authorization: Bearer {token}` 头。

### 3.1 认证


| Method | Path                           | 说明                                                       |
| ------ | ------------------------------ | -------------------------------------------------------- |
| GET    | `/api/v1/auth/notion/url`      | 返回 Notion OAuth 授权 URL                                   |
| GET    | `/api/v1/auth/notion/callback` | OAuth 回调，code 换 token，302 重定向到 `linkdo://auth?token=xxx` |
| GET    | `/api/v1/auth/me`              | 获取当前用户信息（name, avatar）                                   |
| POST   | `/api/v1/auth/logout`          | 清除 token，登出                                              |


### 3.2 Collection


| Method | Path                           | 说明                                                 |
| ------ | ------------------------------ | -------------------------------------------------- |
| GET    | `/api/v1/collections`          | 列表，含 pending_count / estimated_total / 任务预览（前 4 条） |
| POST   | `/api/v1/collections`          | 创建（同步创建 Notion Database）                           |
| GET    | `/api/v1/collections/:id`      | 详情，含全部任务按 status 分组                                |
| PATCH  | `/api/v1/collections/:id`      | 更新名称/图标/归档状态                                       |
| DELETE | `/api/v1/collections/:id`      | 删除（归档 Notion Database）                             |
| POST   | `/api/v1/collections/:id/sync` | 手动触发该 Collection 的 Notion 同步                       |


### 3.3 Task


| Method | Path                            | 说明                                         |
| ------ | ------------------------------- | ------------------------------------------ |
| POST   | `/api/v1/collections/:id/tasks` | 创建任务（同步创建 Notion Page）                     |
| PATCH  | `/api/v1/tasks/:id`             | 更新标题/预估时间/排序                               |
| PATCH  | `/api/v1/tasks/:id/status`      | 移动任务状态（backlog → this_week → today → done） |
| DELETE | `/api/v1/tasks/:id`             | 删除（归档 Notion Page）                         |


### 3.4 Timer


| Method | Path                            | 说明                                                  |
| ------ | ------------------------------- | --------------------------------------------------- |
| POST   | `/api/v1/tasks/:id/timer/start` | 开始计时，创建 TimeSession，返回 started_at                   |
| POST   | `/api/v1/tasks/:id/timer/stop`  | 停止计时，记录 ended_at + duration，同步写入 Notion             |
| GET    | `/api/v1/timer/current`         | 获取当前活跃计时状态（task_id, started_at, elapsed），前端 5 分钟校准用 |


### 3.5 同步


| Method | Path           | 说明                            |
| ------ | -------------- | ----------------------------- |
| POST   | `/api/v1/sync` | 全量同步所有 Collection，应用启动时自动调用一次 |


---

## 4. Go API 内部架构

```
backend/
├── main.go                    # 入口，启动 HTTP server
├── .env
├── go.mod / go.sum
└── internal/
    ├── config/
    │   └── config.go          # 环境变量加载
    ├── http/
    │   ├── router.go          # 路由注册
    │   ├── middleware.go       # Auth 中间件 + Logger + Recovery
    │   ├── auth.go            # OAuth URL / Callback / Me / Logout
    │   ├── collection.go      # Collection CRUD handlers
    │   ├── task.go            # Task CRUD + Status handlers
    │   ├── timer.go           # Start / Stop / Current handlers
    │   └── sync.go            # 全量同步 handler
    ├── service/
    │   ├── auth.go            # OAuth 流程 + token 管理
    │   ├── collection.go      # Collection 业务逻辑
    │   ├── task.go            # Task 业务逻辑 + 状态流转
    │   ├── timer.go           # 计时 session 管理
    │   └── sync.go            # Notion 双向同步调度
    ├── notion/
    │   ├── client.go          # Notion API HTTP 客户端
    │   ├── oauth.go           # OAuth code→token 交换
    │   ├── database.go        # Database (Collection) 操作
    │   ├── page.go            # Page (Task) 操作
    │   └── mapper.go          # Notion ↔ 内部模型转换
    ├── store/
    │   └── memory.go          # 内存缓存 (Collections + Tasks + Timer)
    └── types/
        ├── api.go             # Request/Response DTOs
        ├── collection.go      # Collection 模型
        ├── task.go            # Task 模型
        └── timer.go           # TimeSession 模型
```

### 4.1 分层职责


| 层           | 职责                                     |
| ----------- | -------------------------------------- |
| **http**    | 请求解析、参数校验、调用 service、构造响应              |
| **service** | 业务逻辑编排，协调 notion client 和 memory store |
| **notion**  | Notion API 封装，HTTP 调用和数据映射             |
| **store**   | 内存缓存，应用生命周期内有效                         |
| **types**   | 数据模型定义，各层共享                            |


### 4.2 请求处理流

```
HTTP Request → Middleware (Auth + Log) → Handler → Service → Notion Client → Memory Store
```

- **写操作**: Service → Notion Client (写入 Notion) → 成功后更新 Memory Store → 返回响应
- **读操作**: Service → Memory Store (优先) → 若缓存为空则 Notion Client 拉取 → 返回响应

---

## 5. Notion 数据映射


| Link-Do 概念          | Notion 对象       | 映射关系                                            |
| ------------------- | --------------- | ----------------------------------------------- |
| Collection          | Database        | 一个 Collection = 一个 Notion Database              |
| Task                | Page            | 一个 Task = Database 中的一个 Page                    |
| task.title          | page.title      | Title property                                  |
| task.status         | Select property | "Status" 字段: Backlog / This Week / Today / Done |
| task.estimated_time | Number property | "Estimate (min)" 字段，分钟数                         |
| task.actual_time    | Number property | "Actual (min)" 字段，计时累计分钟数                       |


---

## 6. 前端设计

### 6.1 路由结构


| 路由                     | 页面                            | 窗口模式      |
| ---------------------- | ----------------------------- | --------- |
| `/login`               | LoginPage                     | 标准窗口      |
| `/`                    | HomePage — Collection 列表 (图1) | 标准窗口      |
| `/collection/:id`      | CollectionPage — 看板详情 (图2)    | 标准窗口      |
| `/timer/:collectionId` | TimerPage — 窄屏计时 (图3)         | 343px 窄屏  |
| `/focus`               | FocusPage — 胶囊悬浮窗 (图4)        | 343×48 胶囊 |


### 6.2 窗口状态 × 路由联动

路由切换时自动调用 Tauri Rust command 切换窗口形态：


| 窗口模式     | 尺寸             | 可调节 | 标题栏 | Always on Top |
| -------- | -------------- | --- | --- | ------------- |
| 标准       | ~1440×900      | 是   | 是   | 否             |
| 窄屏计时     | 343px 宽, 高度自适应 | 仅高度 | 是   | 否             |
| 胶囊 Focus | 343×48         | 否   | 否   | 是             |


### 6.3 页面组件树

**HomePage (图1)**

```
├─ TopBar
│  ├─ Greeting (时段问候 + 用户名)
│  └─ ActionBar (搜索/网格/设置/头像)
├─ Sidebar
│  ├─ CreateListButton
│  ├─ AllMyLists
│  └─ ArchivedLists
├─ CollectionGrid
│  ├─ CollectionCard (×N)
│  │  ├─ CardHeader (icon + name + source)
│  │  ├─ TaskPreviewList (前4条)
│  │  └─ CardFooter (pending + est)
│  └─ CreateListCard (虚线 + 图标)
└─ BottomNav (Home / Reports)
```

**CollectionPage (图2)**

```
├─ CollectionHeader
│  ├─ BackButton
│  ├─ CollectionSelector (下拉切换)
│  ├─ StatsText (pending + est)
│  └─ ActionBar (Notion同步/搜索/设置)
├─ KanbanBoard
│  └─ KanbanColumn (×4: Backlog / This Week / Today / Done)
│     ├─ ColumnHeader (名称 + 时间 + 进度条)
│     ├─ TaskCard (×N)
│     │  ├─ TaskTitle
│     │  ├─ SourceIcon + TimeLabel
│     │  └─ EstBadge
│     ├─ AddTaskButton
│     └─ BlitzitButton (仅 Today 列)
└─ BottomNav
```

**TimerPage (图3)**

```
├─ TimerHeader
│  ├─ CollectionIcon + 下拉
│  ├─ ColumnTitle ("Today")
│  └─ Icons (设置/首页/缩放)
├─ ProgressSection
│  ├─ EstLabel ("Est: Xhr")
│  └─ ProgressBar + DoneCount
├─ ActiveTaskCard
│  ├─ TaskName
│  └─ TimerDisplay (HH:MM:SS 粗体)
├─ AddTaskButton
└─ TimerFooter
   ├─ FocusModeButton
   └─ CloseSessionButton
```

**FocusPage (图4)**

```
└─ CapsuleBar
   ├─ TaskName (左侧白字)
   └─ TimerDisplay (右侧 HH:MM:SS)

交互: 单击 → 回到 TimerPage
拖拽: Tauri startDragging
样式: 深色半透明/毛玻璃, 圆角胶囊
```

### 6.4 共享组件


| 组件           | 使用场景          |
| ------------ | ------------- |
| TopBar       | 首页 + 看板       |
| BottomNav    | 首页 + 看板       |
| TaskCard     | 看板 + 计时（不同变体） |
| TimerDisplay | 计时 + 胶囊       |
| SourceIcon   | Notion/本地来源图标 |
| ProgressBar  | 看板列头 + 计时页    |


### 6.5 Zustand Stores

所有 Store 仅管理 UI 状态，业务数据从 API 获取后不做本地持久化。


| Store              | 状态                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| **useAuthStore**   | token, user, isAuthenticated, login(), logout()                                   |
| **useTimerStore**  | activeTaskId, startedAt, elapsed, isRunning, tick(), calibrate(), start(), stop() |
| **useWindowStore** | windowMode (standard/timer/focus), setWindowMode()                                |
| **useUIStore**     | sidebarOpen, searchOpen, gridView 等 UI 开关                                         |


---

## 7. Tauri Rust 层

### 7.1 Commands


| Command                      | 功能                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `set_window_standard()`      | setSize(1440, 900), setResizable(true), setDecorations(true), setAlwaysOnTop(false) |
| `set_window_timer()`         | setSize(343, 动态高度), setResizable(false, true), setDecorations(true)                 |
| `set_window_focus()`         | setSize(343, 48), setResizable(false), setDecorations(false), setAlwaysOnTop(true)  |
| `open_oauth_in_browser(url)` | 用系统默认浏览器打开 Notion OAuth URL                                                         |
| `start_dragging()`           | 胶囊模式拖拽，调用 window.start_dragging()                                                   |


### 7.2 Deep Link

- URL Scheme: `linkdo://`
- 需要 `tauri-plugin-deep-link` 插件
- Tauri 监听 deep link 事件 → 解析 token → event emit 传递给前端

### 7.3 OAuth 完整流程

1. 前端调 `GET /api/v1/auth/notion/url` 获取授权 URL
2. 前端 invoke `open_oauth_in_browser(url)` 打开系统浏览器
3. 用户在浏览器中授权 Notion
4. Notion 重定向到 `GET /api/v1/auth/notion/callback?code=xxx`
5. Go API 用 code 换 access_token，存入内存
6. Go API 返回 302 → `linkdo://auth?token=xxx`
7. macOS 唤起 Tauri App，deep link 插件解析 token
8. Rust 层 emit event → 前端 useAuthStore 保存 token
9. 前端跳转到 `/` 首页，自动触发 `POST /api/v1/sync` 全量同步

---

## 8. 数据模型

### 8.1 Collection


| 字段                 | 类型     | 说明                |
| ------------------ | ------ | ----------------- |
| id                 | string | 唯一标识              |
| name               | string | 集合名称              |
| icon               | string | 图标                |
| source             | enum   | `notion`          |
| notion_database_id | string | 关联的 Notion 数据库 ID |
| pending_count      | int    | 待完成任务数            |
| estimated_total    | int    | 预估总时长（分钟）         |
| archived           | bool   | 是否归档              |


### 8.2 Task


| 字段             | 类型         | 说明                                         |
| -------------- | ---------- | ------------------------------------------ |
| id             | string     | 唯一标识                                       |
| collection_id  | string     | 所属集合                                       |
| title          | string     | 任务标题                                       |
| status         | enum       | `backlog` / `this_week` / `today` / `done` |
| estimated_time | int        | 预估时间（分钟）                                   |
| actual_time    | int        | 实际花费时间（累计分钟）                               |
| source         | enum       | `notion`                                   |
| notion_page_id | string     | 关联的 Notion 页面 ID                           |
| completed_at   | timestamp? | 完成时间                                       |
| created_at     | timestamp  | 创建时间                                       |
| sort_order     | int        | 排序序号                                       |


### 8.3 TimeSession


| 字段         | 类型         | 说明      |
| ---------- | ---------- | ------- |
| id         | string     | 唯一标识    |
| task_id    | string     | 关联任务    |
| started_at | timestamp  | 开始时间    |
| ended_at   | timestamp? | 结束时间    |
| duration   | int        | 持续时长（秒） |


---

## 9. 错误处理


| 场景             | 处理方式                                       |
| -------------- | ------------------------------------------ |
| Notion API 不可用 | Go API 返回 502，前端显示 "Notion 同步失败，请重试" toast |
| OAuth token 过期 | Go API 返回 401，前端跳转 `/login`                |
| 计时器校准失败        | 静默忽略，继续使用本地时间，下次校准再试                       |
| 创建/更新失败        | Go API 返回具体错误码，前端显示错误消息                    |
| 同步冲突           | Last Write Wins，以最后写入为准                    |


---

## 10. 前端目录结构

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx           # 根页面
│   │   ├── home/              # 首页路由 /home
│   │   │   └── page.tsx
│   │   └── work/              # 工作看板路由 /work
│   │       └── page.tsx
│   ├── components/            # React 组件
│   │   └── theme-provider.tsx
│   ├── config/                # 配置文件
│   │   └── index.ts
│   ├── lib/                   # 工具函数
│   │   └── utils.ts
│   ├── providers/             # React Providers
│   │   └── base.tsx
│   ├── services/              # API 服务层
│   │   ├── base.ts
│   │   └── client-request.ts
│   ├── styles/                # 全局样式
│   ├── types/                 # TypeScript 类型
│   │   └── base.ts
│   └── utils/                 # 工具函数
│       └── base.ts
```

### 10.1 命名规范

- 文件命名：**kebab-case**（如 `client-request.ts`、`theme-provider.tsx`）
- 组件命名：**PascalCase**
- 目录命名：**kebab-case**
- 使用 Next.js App Router 路由系统
- 使用 Zustand 管理 UI 状态

