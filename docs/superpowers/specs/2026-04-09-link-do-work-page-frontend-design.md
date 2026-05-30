# Link-Do Work Page 前端设计

## 1. 项目概述

Link-Do 是一款 macOS 桌面端任务管理与专注计时工具。本文档描述 /work 页面及其相关功能的前端设计方案。

### 技术栈
- **框架**：Tauri 2 + React 19 + Next.js App Router
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **API 调用**：ahooks useRequest

---

## 2. 页面结构

```
/work 页面 (主容器)
├── Header (Logo, Search, User)
├── 视图区域 (根据 viewMode 切换)
│   ├── viewMode: "kanban" → 看板视图 (4列)
│   ├── viewMode: "focus" → Focus 视图 (343px侧边栏)
│   └── viewMode: "collection" → Collection 看板 (点击卡片进入)
└── Slide-over 抽屉 (右侧滑出, Notion同步面板)
    ├── Tab: 数据 (搜索 + Page列表)
    └── Tab: 设置 (状态映射)
```

---

## 3. Zustand Store

### useWorkStore

```typescript
interface NotionPage {
  id: string;
  title: string;
  status: string;
  icon?: string;
  url: string;
}

interface StatusMapping {
  appStatus: "backlog" | "thisWeek" | "today" | "done";
  notionStatus: string;
}

interface Task {
  id: string;
  title: string;
  estimatedTime: string;
  source?: "github" | "notion" | "completed";
  tag?: { label: string; color: string; bgColor: string };
  isDone?: boolean;
  isHighlighted?: boolean;
  collectionId?: string;
}

interface WorkState {
  // 视图模式
  viewMode: "kanban" | "focus" | "collection";

  // 当前选中的 Collection
  currentCollectionId: string | null;

  // Focus 模式
  focusMode: {
    isActive: boolean;
    currentTaskId: string | null;
    elapsedTime: number; // 秒
  };

  // Slide-over 面板
  slideOver: {
    isOpen: boolean;
    activeTab: "data" | "settings";
    notionPages: NotionPage[];
    statusMapping: StatusMapping[];
    searchQuery: string;
  };

  // 任务列表 (按列分组)
  tasks: {
    backlog: Task[];
    thisWeek: Task[];
    today: Task[];
    done: Task[];
  };

  // Actions
  setViewMode: (mode: WorkState["viewMode"]) => void;
  selectCollection: (id: string | null) => void;
  openSlideOver: () => void;
  closeSlideOver: () => void;
  setSlideOverTab: (tab: "data" | "settings") => void;
  setStatusMapping: (mapping: StatusMapping[]) => void;
  setSearchQuery: (query: string) => void;
  setNotionPages: (pages: NotionPage[]) => void;
  addTask: (task: Task) => void;
  moveTask: (taskId: string, fromColumn: string, toColumn: string) => void;
  setFocusTask: (taskId: string | null) => void;
  updateElapsedTime: (time: number) => void;
  toggleFocusMode: () => void;
}
```

---

## 4. 视图切换交互

### 4.1 看板视图 (默认)
- 显示 4 列：Backlog、This Week、Today (高亮)、Done
- 每个 Column 有进度条、任务卡片列表
- Today 列底部有 "Blitzit Now" 按钮
- 右下角有 FAB 按钮

### 4.2 Collection 视图
- 点击 Collection 卡片 → `setViewMode("collection")` + `selectCollection(id)`
- 渲染该 Collection 的任务看板
- 右上角显示**同步按钮**（齿轮/同步图标）
- 点击同步按钮 → `openSlideOver()` → 右侧滑出 Notion 面板
- 顶部有**返回按钮** → `setViewMode("kanban")` → 恢复看板视图，状态保留

### 4.3 Focus 模式
- 点击 "Focus Mode" 按钮 → `setViewMode("focus")`
- 页面宽度收缩为 343px，显示专注计时 UI
- 显示：任务名称、计时器（00:00:00）、Live 状态、开始/暂停按钮
- 点击返回按钮 → `setViewMode("kanban")` → 状态保留

---

## 5. 创建任务流程

1. 点击 Column 头部的 **+ ADD TASK**
2. 弹出 Modal：
   - 任务名称输入框
   - 预估时间选择器
   - 状态选择器 (Backlog / This Week / Today)
3. 提交后调用 API 创建任务
4. 调用 `addTask()` 更新 store

---

## 6. Notion 同步面板 (Slide-over)

### 6.1 布局
- 宽度：480px
- 右侧滑入，带遮罩层
- 顶部：返回按钮 + 标题 "Notion 工作台"
- 两个 Tab：数据 / 设置

### 6.2 数据 Tab
- 搜索框：过滤 Notion Page 列表
- Page 列表：显示标题、状态点、图标
- 列表项可点击查看详情

### 6.3 设置 Tab
- 状态映射配置：
  - Backlog → [Notion Status 下拉选择]
  - This Week → [Notion Status 下拉选择]
  - Today → [Notion Status 下拉选择]
  - Done → [Notion Status 下拉选择]
- 底部同步按钮

---

## 7. API 服务层

### 7.1 需要实现的方法

```typescript
// 任务相关
export function getTasks(collectionId?: string) { }
export function createTask(task: CreateTaskDTO) { }
export function updateTask(taskId: string, data: UpdateTaskDTO) { }
export function deleteTask(taskId: string) { }

// Collection 相关
export function getCollections() { }
export function createCollection(data: CreateCollectionDTO) { }
export function updateCollection(collectionId: string, data: UpdateCollectionDTO) { }
export function deleteCollection(collectionId: string) { }

// Notion 相关
export function getNotionPages(databaseId: string) { }
export function syncNotionDatabase(databaseId: string) { }
export function getStatusOptions(databaseId: string) { }
export function updateStatusMapping(mapping: StatusMapping[]) { }
export function connectNotion() { } // OAuth 跳转
export function getNotionDatabases() { }

// Focus 会话
export function startFocusSession(taskId: string) { }
export function stopFocusSession() { }
export function getActiveSession() { }
```

---

## 8. 文件结构

```
frontend/src/
├── app/
│   ├── work/
│   │   └── page.tsx                    # 主页面
├── components/
│   ├── work/
│   │   ├── kanban/
│   │   │   ├── column.tsx              # 看板列
│   │   │   ├── task-card.tsx           # 任务卡片
│   │   │   └── kanban-board.tsx        # 看板主体
│   │   ├── focus/
│   │   │   ├── focus-sidebar.tsx       # Focus 侧边栏
│   │   │   └── timer-display.tsx       # 计时器显示
│   │   ├── slide-over/
│   │   │   ├── notion-panel.tsx        # Notion 面板
│   │   │   ├── data-tab.tsx            # 数据 Tab
│   │   │   └── settings-tab.tsx         # 设置 Tab
│   │   ├── modals/
│   │   │   └── create-task-modal.tsx   # 创建任务 Modal
│   │   └── header.tsx                  # 页面 Header
├── stores/
│   └── use-work-store.ts               # Zustand Store
├── services/
│   ├── task.ts                          # 任务 API
│   ├── collection.ts                    # Collection API
│   ├── notion.ts                        # Notion API
│   └── focus.ts                         # Focus 会话 API
└── types/
    └── work.ts                          # 工作页类型定义
```

---

## 9. 组件清单

| 组件 | 描述 | 依赖 |
|------|------|------|
| KanbanBoard | 4列看板容器 | Column, TaskCard |
| Column | 单列（标题、进度条、任务列表、+ADD TASK） | TaskCard |
| TaskCard | 任务卡片 | - |
| FocusSidebar | Focus 模式侧边栏 (343px) | TimerDisplay |
| TimerDisplay | 计时器显示 00:00:00 | - |
| NotionPanel | Slide-over 抽屉面板 | DataTab, SettingsTab |
| DataTab | Notion Page 列表 + 搜索 | - |
| SettingsTab | 状态映射配置 | - |
| CreateTaskModal | 创建任务弹窗 | - |
| Header | 页面顶部导航 | - |

---

## 10. 状态流图

```
用户操作              Store 更新              UI 渲染
─────────────────────────────────────────────────────
点击 Collection卡片 → selectCollection(id) → 切换到 collection 视图
点击同步按钮      → openSlideOver()      → 显示 Slide-over
切换 Tab          → setSlideOverTab()    → 切换 Tab 内容
点击 Focus Mode   → setViewMode("focus") → 343px 侧边栏
点击 ADD TASK     → (打开 Modal)         → 提交后 addTask()
```

---

## 11. 实现顺序

1. **Zustand Store** - `useWorkStore` 定义所有状态和 actions
2. **API 服务层** - 实现各模块的 API 调用方法
3. **Header 组件** - 页面顶部导航
4. **Kanban 看板** - Column、TaskCard、KanbanBoard
5. **创建任务 Modal** - + ADD TASK 弹窗
6. **Focus 侧边栏** - Focus 视图 (343px)
7. **Notion Slide-over** - 数据 Tab + 设置 Tab
8. **视图切换逻辑** - 整合所有视图切换
