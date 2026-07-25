# Link-Do Agent API

Python AI Agent 服务，基于 **FastAPI + LangGraph + MCP + LangSmith** 架构，通过 SSE 流式输出与前端通信，通过 MCP 工具操作用户任务数据（Notion）。

## 架构概览

```
Frontend (Tauri/React)
        │  POST /v1/chat/stream
        │  POST /v1/chat/confirm
        ▼
FastAPI (app/main.py)
        │
        ├── app/api/routes/chat.py
        │       ├── chat_stream()     ── 两阶段流程
        │       └── chat_confirm()    ── 执行确认计划
        │
        ├── app/agent/
        │       ├── graph.py          LangGraph 状态机
        │       ├── nodes.py          classify / plan / executor / synthesizer
        │       └── client.py         MCPClient 封装 + LangSmith @traceable
        │
        ├── app/mcp/
        │       ├── manager.py        MCPConnectionManager（SSE 会话生命周期）
        │       ├── connection.py     MCPConnection（JSON-RPC 发送器）
        │       └── sse.py            SSEClient（EventSource + 重连）
        │
        └── app/tracing.py            LangSmith @traceable LLM 调用
                │
                ▼
        LangSmith Cloud（可观测性）

MCP Server (Notion / 自定义)
        ▲  JSON-RPC 2.0 over SSE
        │
        └─ MCPConnectionManager ── MCPClient
```

## 目录结构

```
services/agent/
├── app/
│   ├── main.py                      FastAPI 入口 + lifespan 钩子 + MCP 初始化
│   ├── config.py                    Pydantic Settings（LLM / LangSmith / MCP / CORS）
│   ├── tracing.py                   LangSmith @traceable LLM 追踪
│   ├── runtime_state.py             全局单例状态（graph / mcp_client）
│   ├── api/
│   │   ├── dependencies.py          verify_api_key 依赖
│   │   ├── routes/
│   │   │   └── chat.py             POST /v1/chat/stream · POST /v1/chat/confirm
│   │   └── schemas.py               Pydantic 请求/响应模型
│   ├── agent/
│   │   ├── graph.py                 LangGraph：classify → plan → confirm → execute
│   │   ├── nodes.py                 节点实现（LLM 路由 / 规划器 / 执行器 / 综合器）
│   │   └── client.py                MCPClient 封装 + @traceable(run_type=tool)
│   ├── mcp/
│   │   ├── manager.py               MCPConnectionManager（SSE 生命周期 / 工具发现）
│   │   ├── connection.py           MCPConnection（pending-future JSON-RPC 映射）
│   │   ├── sse.py                  SSEClient（EventSource / JSON-RPC 解析）
│   │   └── tool.py                 MCP JSON-RPC 类型定义
│   └── utils/
│       └── logger.py                Pydantic.StructuredLogger → JSON 控制台 + 文件
├── pyproject.toml                   uv 依赖管理
└── README.md
```

## 快速开始

```bash
cd services/agent

# 安装依赖
uv sync

# 配置环境变量
cp .env.example .env
# 填入 .env 中的 AGENT_API_KEY、LLM_API_KEY 等

# 启动服务
uv run linkdo-agent
# 或
uv run python -m app.main
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `AGENT_API_KEY` | API 认证密钥（必填） | `""` |
| `LLM_API_KEY` | LLM API Key | `""` |
| `LLM_BASE_URL` | LLM API 地址 | `https://api.deepseek.com` |
| `LLM_MODEL` | 模型名称 | `deepseek-chat` |
| `AGENT_MCP_SERVER_COMMAND` | MCP Server 启动命令 | `npx -y @modelcontextprotocol/server-filesystem /tmp` |
| `AGENT_MCP_SERVER_CWD` | MCP 工作目录 | `/tmp` |

## API

### POST /v1/chat/stream

流式对话主入口，支持**两阶段确认模式**。

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

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 用户输入 |
| `session_id` | string\|null | 会话 ID（首次为 null，自动生成 UUID） |
| `confirm` | boolean | `true`：两阶段流程；`false`：直接执行 |

**SSE 事件流（confirm=true 两阶段）：**

```
Step 1 → POST /v1/chat/stream
  event: confirm        → 返回执行计划，前端展示给用户确认
  event: error           → 若 Agent 未就绪

Step 2 → POST /v1/chat/confirm?session_id=xxx
  event: text            → 流式文本片段（累积输出）
  event: done            → 执行完成
  event: error           → 执行出错
```

**SSE 事件流（confirm=false 直接执行）：**

```
POST /v1/chat/stream
  event: text            → 流式文本片段
  event: done            → 完成
  event: error           → 出错
```

### POST /v1/chat/confirm

两阶段确认流程第二步：用户确认后继续执行计划。

**Query 参数：**
```
session_id: 从 confirm 事件中获取的 session_id
```

### GET /health

健康检查。

## Agent 执行流程

```
用户消息
    │
    ▼
classify_node ──→ LLM 分类意图（NEED_CONFIRM / NO_CONFIRM / EXECUTE_ONLY）
    │
    ├── intent=chat
    │       ▼
    │   synthesizer_node → 直接流式回复（done）
    │
    └── intent≠chat
            ▼
        plan_node ──→ LLM 生成 Plan（step[] 含 tool + reasoning）
            │
            ├── needs_confirm=True
            │       ▼
            │   yield confirm 事件（前端展示计划）
            │       │
            │       ▼  POST /v1/chat/confirm
            │   run_executor() ──→ 执行每一步（MCP call_tool / plan_fallback）
            │       │
            │       ▼
            │   synthesizer_node → 流式回复（done）
            │
            └── needs_confirm=False
                    ▼
                run_executor() → synthesizer_node → 流式回复（done）
```

## LangSmith 追踪

`app/tracing.py` 中 `@traceable(run_type="llm")` 装饰原始 HTTP 调用函数，直接捕获流式块事件：

```
@traceable(run_type="llm", name="DeepSeek Chat Completion")
def _traced_raw_chat(messages):
    return _get_client().chat.completions.create(stream=True, ...)
```

工具调用通过 `app/agent/client.py` 中的 `@traceable(run_type="tool")` 捕获：

```python
@traceable(run_type="tool")
async def traced(self: MCPClient, tool_name: str, arguments: dict) -> str:
    return await MCPClient.call_tool(self, tool_name, arguments)

mcp_client.call_tool = MethodType(traced, mcp_client)
```
