# Link-Do Agent API

FastAPI 服务，提供流式对话 API（基于 SSE），Agent 通过 MCP 工具操作用户任务数据。

## 快速开始

```bash
# 安装依赖
cd agent
pip install -e .

# 复制环境变量
cp .env.example .env
# 编辑 .env，填入 AGENT_API_KEY、LLM_API_KEY 等

# 启动服务
linkdo-agent
# 或
python -m app.main
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `AGENT_API_KEY` | API 认证密钥（必填） | `""` |
| `LLM_API_KEY` | LLM API Key | `""` |
| `LLM_BASE_URL` | LLM API 地址 | `https://api.deepseek.com` |
| `LLM_MODEL` | 模型名称 | `deepseek-chat` |
| `AGENT_MCP_SERVER_COMMAND` | MCP Server 启动命令 | `["npx", "-y", "@modelcontextprotocol/server-filesystem", "/tmp"]` |
| `AGENT_MCP_SERVER_CWD` | MCP 工作目录 | `/tmp` |

## API

### POST /v1/chat/stream

流式对话。

**请求头：**
```
X-API-Key: <AGENT_API_KEY>
```

**请求体：**
```json
{
  "message": "帮我查看今天的任务",
  "session_id": null,
  "confirm": true
}
```

**SSE 事件流（confirm=true 两阶段）：**

1. `confirm` 事件 → 返回执行计划，前端展示给用户确认
2. 前端调用 `POST /v1/chat/confirm?session_id=xxx` 确认
3. `execute_start` → `text` → `done` 事件流

**SSE 事件流（confirm=false 直接执行）：**

直接输出 `execute_start` → `text` → `done`

### POST /v1/chat/confirm

两阶段确认第二步：用户确认后继续执行。

### GET /health

健康检查。
