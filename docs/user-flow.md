
# Link-Do 用户流程

## 完整流程概览

```
OAuth 授权 → 创建 Collection → 关联 Notion DB → 设置状态映射 → 创建任务 → 计时 → 更新状态 → 完成任务
```

---

## Step 1: OAuth 授权（首次使用）

**目的**：让用户登录并授权 Link-Do 访问 Notion 数据

```
1. 打开 App → 请求 OAuth URL
   GET /api/v1/auth/notion/url

2. 浏览器打开返回的 OAuth URL → 用户在 Notion 授权

3. 授权成功 → 回调
   GET /api/v1/auth/notion/callback?code=xxx

4. 后端用 code 换 token → 返回用户信息
   响应: { "success": true, "data": { "token": 1, "name": "用户" } }

5. App 保存 token，后续请求 Header 带上:
   Authorization: Bearer {token}
```

---

## Step 2: 创建 Collection

**目的**：用户创建一个自己的任务集合

```
POST /api/v1/collections
Body: { "name": "我的工作", "icon": "📋" }
响应: { "success": true, "data": { "id": 1, "name": "我的工作", ... } }
```

---

## Step 3: 搜索并关联 Notion DB

**目的**：让用户选择要同步的 Notion Database

```
1. 搜索用户有权限的 Notion DB
   GET /api/v1/auth/notion/databases?query=

2. 用户在 Notion 中给 integration 授权共享 DB（手动操作）

3. 注册 DB 到 Collection
   POST /api/v1/notion-databases
   Body: {
     "collection_id": 1,
     "notion_database_id": "29ad250f-8d4d-8035-9150-effd56e9b296",
     "name": "a-link-do",
     "icon": "📋"
   }
```

---

## Step 4: 拉取并设置状态映射

**目的**：建立 App 状态（backlog/today/done）和 Notion 状态选项之间的对应关系

```
1. 从 Notion DB 拉取可用的状态选项
   POST /api/v1/notion-databases/{id}/status-mapping/fetch
   响应: { "success": true, "data": ["未开始", "进行中", "完成"] }

2. 查看当前映射（初始为空）
   GET /api/v1/notion-databases/{id}/status-mapping
   响应: { "success": true, "data": { "notion_options": [...], "mapping": {} } }

3. 用户配置映射关系并更新
   PUT /api/v1/notion-databases/{id}/status-mapping
   Body: {
     "mapping": {
       "backlog": ["未开始"],
       "today": ["进行中"],
       "done": ["完成"]
     }
   }
```

**映射说明**：
- `backlog` → Notion 中对应：未开始
- `today` → Notion 中对应：进行中
- `done` → Notion 中对应：完成

---

## Step 5: 创建任务

**目的**：在 Collection 下创建一个新任务，同时在 Notion 同步创建 Page

```
POST /api/v1/collections/{collection_id}/tasks
Body: { "title": "完成文档", "estimated_time": 30 }
响应: { "success": true, "data": { "id": 1, "title": "完成文档", "status": "backlog", ... } }
```

---

## Step 6: 计时管理

**目的**：记录任务花费的时间

```
1. 开始计时
   POST /api/v1/tasks/{task_id}/timer/start
   响应: { "success": true, "data": { "id": 1, "task_id": 1, "started_at": "...", "duration": 0 } }

2. 查看当前计时（实时）
   GET /api/v1/timer/current
   响应: { "success": true, "data": { "duration": 123, "started_at": "..." } }

3. 停止计时（自动累加时间到任务的 actual_time）
   POST /api/v1/tasks/{task_id}/timer/stop
   响应: { "success": true }
```

---

## Step 7: 更新任务状态

**目的**：改变任务状态，触发 Notion 同步更新

```
1. 标记为今天（today）
   PATCH /api/v1/tasks/{task_id}/status
   Body: { "status": "today" }
   响应: { "success": true }
   Notion 同步：Page 状态更新为"进行中"

2. 完成任务（done）
   PATCH /api/v1/tasks/{task_id}/status
   Body: { "status": "done" }
   响应: { "success": true }
   Notion 同步：Page 状态更新为"完成"
```

---

## 状态枚举

| App 状态 | 说明 |
|---------|------|
| backlog | 待处理 |
| this_week | 本周待办 |
| today | 今日待办 |
| done | 已完成 |

---

## 同步逻辑说明

- **创建任务**：在 Notion 创建 Page 时，根据当前状态自动设置 Notion 状态值
- **更新状态**：通过映射表将 App 状态转换为对应的 Notion 状态，更新 Notion Page
- **映射为空时**：使用默认值（backlog→未开始，today→进行中，done→完成）
