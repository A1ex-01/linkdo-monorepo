# Link-Do Backend TODO

> 最后更新: 2026-04-08

## 已完成

### ✅ Collection 与 Notion DB 解耦
**完成时间**: 2026-04-08
**描述**:
- Collection 不再绑定单个 Notion DB
- 一个 Collection 可包含多个 Notion DB（工作区、生活区等）
- 每个 DB 独立 ID，Task 创建时指定目标 DB

**子任务**:
- [x] 设计新的数据结构（Collection 与多个 DB 的关系）
- [x] 修改 Task 创建逻辑，支持指定目标 DB
- [x] 更新 Collection CRUD API

### ✅ 动态状态映射表
**完成时间**: 2026-04-08
**描述**:
- 拉取 Notion DB 时自动获取 `状态` 属性的所有选项
- 映射表动态存储，如:
  ```
  Notion "New" → app "backlog"
  Notion "In Progress" → app "today"
  Notion "Done" → app "done"
  ```
- SyncStatus 逻辑使用动态映射

**子任务**:
- [x] 设计映射表存储结构 (NotionDatabase.StatusMapping)
- [x] 实现首次连接时自动拉取状态选项 (POST /notion-databases/{id}/status-mapping/fetch)
- [x] 修改 SyncStatus 逻辑使用动态映射

### ✅ Notion OAuth DB 选择器
**完成时间**: 2026-04-08
**描述**:
- 实现完整的 Notion OAuth 2.0 流程
- 弹出浏览器让用户选择授权的 DB
- 返回用户选中的 DB 列表并存储

**子任务**:
- [x] 完成 Notion OAuth Callback 处理
- [x] 实现 Search API 获取用户可访问的 DB (GET /auth/notion/databases)
- [x] 创建 DB 选择 API/界面 (通过 NotionDatabase CRUD API)

### ✅ Task 创建时同步 Notion Page
**完成时间**: 2026-04-07
**描述**: 创建 Task 时自动在 Notion DB 中创建对应 Page

### ✅ 状态同步逻辑
**完成时间**: 2026-04-07
**描述**:
- 创建时: backlog → "未开始"
- 更新为 this_week/today → "进行中"
- 更新为 done → "已完成"

### ✅ 数据库迁移机制
**完成时间**: 2026-04-07
**描述**: 实现 SQL 文件迁移，支持后续数据库结构调整

### ✅ Debug 调试支持
**完成时间**: 2026-04-07
**描述**: 配置 Cursor 断点调试和 /debug 端点

---

## 备注

- 使用 `migrations/` 目录管理数据库变更
- 使用 `.env` 配置 Notion OAuth 凭证
