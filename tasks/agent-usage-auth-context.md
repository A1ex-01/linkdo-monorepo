# LangGraph Agent Usage 记录遗留项

## 现状

Agent 已具备在模型调用完成后记录 `total_tokens` 的中间件，后端也有 `POST /api/agent/usage` 和 `agent_usage_events` 表。

直接从 LangGraph Studio / 定位页面发起 run 时，HTTP `Authorization` 只用于 LangGraph 认证，不会自动写入 `runtime.context.token`。因此早期依赖该字段的 usage 记录不会执行。

当前代码已改为从 LangGraph 运行配置中的 `langgraph_auth_user.identity` 获取当前用户 UUID，并通过内部服务密钥调用后端 usage 接口，避免将用户 Bearer Token 放进线程状态或 Graph context。

## 后续需要完成

1. 为后端配置 `AGENT_USAGE_API_KEY`。
2. 为 Agent 配置相同值的 `LINKDO_AGENT_USAGE_API_KEY`。
3. 重启 backend 与 LangGraph Agent 服务。
4. 使用 LangGraph Studio 发送一条消息，确认后端的 `agent_usage_events` 新增记录：
   - `user_id` 对应当前已认证用户；
   - `total_tokens` 大于 0；
   - `created_at` 为本次调用时间。
5. 若没有记录，检查 Agent 日志中的：
   - `agent_usage_not_recorded: LINKDO_AGENT_USAGE_API_KEY is not configured`
   - `agent_usage_not_recorded: backend request failed`

## 相关实现

- `services/agent/core/usage_meter.py`
- `services/agent/core/auth.py`
- `services/backend/base_service/internal/handler/agent_usage_handler.go`
- `services/backend/base_service/middleware/auth_middleware.go`
- `services/backend/base_service/internal/model/agent_usage.go`

