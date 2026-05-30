# 安装: pip install langgraph langchain-deepseek python-dotenv httpx

import os
import re
import json
import time
import asyncio
import httpx
import operator
from datetime import datetime
from typing import TypedDict, Annotated
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")


# ─────────────────────────────────────────────
# 日志工具
# ─────────────────────────────────────────────
def _ts() -> str:
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]

def _section(title: str, char: str = "─", width: int = 70):
    print(f"\n{char * width}")
    print(f"  [{title}]")
    print(char * width)

def _log_step(step: str, msg: str):
    print(f"  [STEP]  [{step:20s}]  {msg}")

def _log_mcp(action: str, detail: str = ""):
    print(f"  [MCP ]  [{action:20s}]  {detail}")

def _log_llm(action: str, detail: str = ""):
    print(f"  [LLM ]  [{action:20s}]  {detail}")

def _log_agent(action: str, detail: str = ""):
    print(f"  [AGT ]  [{action:20s}]  {detail}")

def _log_tool(action: str, detail: str = ""):
    print(f"  [TOOL]  [{action:20s}]  {detail}")

def _log_retry(action: str, detail: str = ""):
    print(f"  [RETRY] [{action:20s}]  {detail}")

def _banner(msg: str):
    print(f"\n{'═' * 70}")
    print(f"  {msg}")
    print('═' * 70)


# ─────────────────────────────────────────────
# MCP 配置
# ─────────────────────────────────────────────
MCP_BASE_URL = os.getenv("MCP_BASE_URL", "http://127.0.0.1:3456")
MCP_TOKEN = os.getenv("MCP_TOKEN", "")


def build_headers() -> dict:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if MCP_TOKEN:
        headers["Authorization"] = f"Bearer {MCP_TOKEN}"
    return headers


# ─────────────────────────────────────────────
# MCP Client（手写 StreamableHTTP 协议）
# ─────────────────────────────────────────────
class MCPClient:
    def __init__(self, url: str, token: str):
        self.url = url.rstrip("/") + "/mcp"
        self.token = token
        self._session_id: str | None = None
        self._client: httpx.AsyncClient | None = None
        self._protocol_version: str | None = None
        self._tool_schemas: list[dict] = []

    async def connect(self):
        _log_mcp("CONNECTING", f"目标地址: {self.url}")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))

        _log_mcp("SENDING", "initialize 请求 (id=1)")
        resp = await self._raw_request({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-11-25",
                "capabilities": {},
                "clientInfo": {"name": "linkdo-agent", "version": "1.0"},
            },
        })
        init_result = self._parse_response(resp)
        result = init_result.get("result", {})
        self._protocol_version = result.get("protocolVersion")
        _log_mcp("RECEIVED", f"serverInfo={result.get('serverInfo')}, version={self._protocol_version}")

        self._session_id = (
            resp.headers.get("mcp-session-id")
            or resp.headers.get("MCP-SESSION-ID")
            or resp.headers.get("X-MCP-Session-ID")
        )
        if self._session_id:
            _log_mcp("SESSION", f"获取到: {self._session_id[:20]}...")
        else:
            _log_mcp("SESSION", "警告: 无 session_id，将不使用 session 模式")

        try:
            _log_mcp("SENDING", "notifications/initialized")
            await self._client.post(self.url, json={
                "jsonrpc": "2.0",
                "method": "notifications/initialized",
                "params": {},
            }, headers=build_headers())
        except Exception as e:
            _log_mcp("SEND_ERROR", str(e))

        _log_mcp("SENDING", "tools/list 请求 (id=2)")
        tools_resp = await self._send_request({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {},
        })
        tools = tools_resp.get("result", {}).get("tools", [])
        self._tool_schemas = [
            {
                "name": t.get("name", ""),
                "description": t.get("description", ""),
                "input_schema": t.get("inputSchema", {}),
            }
            for t in tools
        ]
        print(f"\n  [MCP ]  [{'TOOLS DISCOVERED':20s}]  发现 {len(self._tool_schemas)} 个工具:")
        for i, t in enumerate(self._tool_schemas, 1):
            print(f"                    {i:2d}. {t['name']}: {t['description'][:60]}")

    async def _raw_request(self, payload: dict) -> httpx.Response:
        headers = build_headers()
        if self._session_id:
            headers["MCP-SESSION-ID"] = self._session_id

        _log_mcp("HTTP_REQUEST", f"method={payload.get('method', 'notification')}")
        _log_mcp("  payload", json.dumps(payload, ensure_ascii=False)[:200])

        resp = await self._client.post(self.url, json=payload, headers=headers)
        resp.raise_for_status()
        _log_mcp("HTTP_RESPONSE", f"status={resp.status_code}")
        return resp

    def _parse_response(self, resp: httpx.Response) -> dict:
        content_type = resp.headers.get("content-type", "")
        text = resp.text

        if "text/event-stream" in content_type:
            for line in text.split("\n"):
                line = line.strip()
                if line.startswith("data:"):
                    data = line[5:].strip()
                    try:
                        return json.loads(data)
                    except json.JSONDecodeError:
                        pass
        else:
            try:
                return resp.json()
            except Exception:
                pass
        return {}

    async def _send_request(self, payload: dict) -> dict:
        resp = await self._raw_request(payload)
        return self._parse_response(resp)

    async def call_tool(self, tool_name: str, arguments: dict) -> str:
        if not self._client:
            return "[MCP 未连接]"

        _log_tool("CALLING", f"{tool_name}")
        _log_tool("  args", json.dumps(arguments, ensure_ascii=False)[:300])

        try:
            t0 = time.perf_counter()
            resp = await self._send_request({
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments,
                },
            })
            elapsed_ms = (time.perf_counter() - t0) * 1000
            _log_tool("RESPONSE", f"耗时 {elapsed_ms:.1f}ms")

            result = resp.get("result", {})
            content = result.get("content", [])
            if isinstance(content, list) and content:
                result_text = content[0].get("text", str(result))
            else:
                result_text = str(result)

            _log_tool("RESULT_PREVIEW", result_text[:300].replace('\n', ' '))
            return result_text

        except httpx.HTTPStatusError as e:
            err = f"[MCP HTTP 错误] {e.response.status_code}: {e.response.text[:200]}"
            _log_tool("HTTP_ERROR", err)
            return err
        except Exception as e:
            err = f"[MCP 调用失败] {type(e).__name__}: {e}"
            _log_tool("EXCEPTION", err)
            return err

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def tool_schemas(self) -> list[dict]:
        return self._tool_schemas


# ─────────────────────────────────────────────
# 全局 MCP 客户端实例
# ─────────────────────────────────────────────
_mcp_client: MCPClient | None = None

async def get_mcp_client() -> MCPClient:
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPClient(MCP_BASE_URL, MCP_TOKEN)
        await _mcp_client.connect()
    return _mcp_client


# ─────────────────────────────────────────────
# DeepSeek LLM
# ─────────────────────────────────────────────
_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        from langchain_deepseek import ChatDeepSeek
        _llm = ChatDeepSeek(model="deepseek-chat")
    return _llm


# ─────────────────────────────────────────────
# Agent State — LangGraph 状态定义
# ─────────────────────────────────────────────
class AgentState(TypedDict):
    # 消息历史（Annotated 使其累积，operator.add 追加模式）
    messages: Annotated[list, operator.add]
    # 原始用户输入
    original_input: str
    # 意图分类结果
    intent: str               # "task" | "flow" | "chat" | "notion" | "timer"
    intent_confidence: str    # "high" | "medium" | "low"
    intent_reason: str
    # 执行计划（planner 输出）
    plan: list[dict]          # [{"step": int, "action": str, "tool": str|null, "args": dict, "status": str}]
    # 当前步骤索引
    current_step: int
    # 执行结果
    step_results: list[dict]  # [{"step": int, "tool": str, "result": str, "success": bool, "error": str|null}]
    # 确认节点输出
    needs_confirmation: bool
    confirmation_message: str
    # 最终回复
    final_reply: str
    # MCP client（仅运行时注入，不参与序列化）
    mcp_client: MCPClient | None


# ─────────────────────────────────────────────
# 规则引擎：基于关键词的意图分类
# ─────────────────────────────────────────────
def _rules_classify(text: str) -> dict | None:
    """
    基于关键词的规则引擎意图分类。
    返回 None 表示无法匹配，需要降级到 LLM。
    """
    t = text.lower()

    # ── Notion / Collection ──
    if any(k in t for k in [
        "notion", "collection", "workspace", "notion 数据库",
        "notion db", "同步", "哪个 collection", "看看 collection",
    ]):
        return {"intent": "notion", "confidence": "high",
                "reason": f"命中关键词: notion/collection"}

    # ── 计时器 / Focus Timer ──
    if any(k in t for k in [
        "计时", "番茄", "focus", "开始计时", "停止计时",
        "专注", "计时器", "pomodoro",
    ]):
        return {"intent": "timer", "confidence": "high",
                "reason": f"命中关键词: timer/focus"}

    # ── 任务管理 ──
    if any(k in t for k in [
        "任务", "todo", "task", "查看任务", "创建任务", "新建任务",
        "更新任务", "删除任务", "move", "移到", "标记完成", "标记为",
        "帮我看看", "显示", "list", "列表", "今天有哪些",
    ]):
        return {"intent": "task", "confidence": "high",
                "reason": f"命中关键词: task"}

    # ── 自动化流程 ──
    if any(k in t for k in [
        "自动", "规则", "workflow", "when", "if", "触发",
        "自动化", "配置", "提醒", "通知",
    ]):
        return {"intent": "flow", "confidence": "high",
                "reason": f"命中关键词: flow"}

    return None


# ─────────────────────────────────────────────
# Node 0: 意图分类（规则引擎 + LLM 兜底）
# ─────────────────────────────────────────────
def intent_classifier(state: AgentState, mcp_client: MCPClient) -> AgentState:
    """
    两层分类：
    1. 规则引擎（关键词匹配，置信度 high）
    2. LLM 兜底（复杂/模糊输入，置信度 medium/low）
    """
    original_input = state.get("original_input", "")
    _section("意图分类", "─", 70)
    _log_agent("INPUT", original_input[:150])

    # ── 规则引擎优先 ──
    rules_result = _rules_classify(original_input)

    if rules_result:
        _log_agent("RULES_MATCH", f"✅ 命中 → intent={rules_result['intent']}, confidence={rules_result['confidence']}")
        _log_agent("REASON", rules_result["reason"])
        return {
            "intent": rules_result["intent"],
            "intent_confidence": rules_result["confidence"],
            "intent_reason": rules_result["reason"],
        }

    _log_agent("RULES_MATCH", "❌ 未命中，降级到 LLM")

    # ── LLM 兜底分类 ──
    from langchain_core.messages import HumanMessage

    tool_schemas = mcp_client.tool_schemas
    tools_text = "\n".join(
        f"- **{t['name']}**: {t['description']}"
        for t in tool_schemas
    ) if tool_schemas else "（无 MCP 工具）"

    system_prompt = f"""你是 Link-Do 任务管理助手。判断用户意图，只能选一个：

- task：查看/创建/更新/删除任务
- notion：Notion 数据库、Collection 相关
- timer：番茄钟计时、专注模式
- flow：自动化规则、工作流
- chat：闲聊、问题、建议，与 Link-Do 功能无关

可用工具：{tools_text}

返回 JSON：
{{"intent": "task|notion|timer|flow|chat", "confidence": "high|medium|low", "reason": "判断理由"}}
"""

    t0 = time.perf_counter()
    response = _get_llm().invoke(
        [HumanMessage(content=f"{system_prompt}\n\n用户说: {original_input}")]
    )
    _log_llm("LLM_OUTPUT", response.content.strip()[:500])
    _log_llm("ELAPSED", f"{(time.perf_counter()-t0)*1000:.1f}ms")

    parsed = {}
    try:
        m = re.search(r"\{.*\}", response.content, re.DOTALL)
        if m:
            parsed = json.loads(m.group())
    except Exception:
        pass

    intent = parsed.get("intent", "chat")
    confidence = parsed.get("confidence", "low")
    reason = parsed.get("reason", "")

    _log_agent("LLM_CLASSIFIED", f"intent={intent}, confidence={confidence}, reason={reason}")
    return {
        "intent": intent,
        "intent_confidence": confidence,
        "intent_reason": reason,
    }


# ─────────────────────────────────────────────
# Node 1: 任务规划器
# ─────────────────────────────────────────────
def planner_node(state: AgentState) -> AgentState:
    """
    根据 intent 生成可执行步骤计划。
    - chat: 无需规划
    - task/notion/timer/flow: LLM 拆解步骤
    """
    from langchain_core.messages import HumanMessage

    intent = state.get("intent", "chat")
    original_input = state.get("original_input", "")
    mcp_client = state.get("mcp_client")

    _section("任务规划", "─", 70)
    _log_agent("INTENT", intent)

    if intent == "chat":
        _log_agent("PLAN", "chat 无需规划")
        return {
            "plan": [],
            "current_step": 0,
            "step_results": [],
            "needs_confirmation": False,
            "confirmation_message": "",
        }

    # ── LLM 规划 ──
    tool_schemas = mcp_client.tool_schemas if mcp_client else []
    tools_text = "\n".join(
        f"- **{t['name']}**: {t['description']}\n  参数: {json.dumps(t['input_schema'], ensure_ascii=False)[:200]}"
        for t in tool_schemas
    ) if tool_schemas else "（无 MCP 工具）"

    planning_prompt = f"""用户请求：「{original_input}」
意图类型：{intent}

可用工具：
{tools_text}

请将请求拆解为有序执行步骤。每步只能调用一个工具，或标记为纯分析（无工具）。

返回 JSON 数组：
[
  {{"step": 1, "action": "操作描述", "tool": "工具名|null", "args": {{"参数": "值"}}, "needs_input": false}},
  ...
]

只输出 JSON。"""

    t0 = time.perf_counter()
    response = _get_llm().invoke(
        [HumanMessage(content=planning_prompt)]
    )
    _log_llm("PLANNER_OUTPUT", response.content.strip()[:500])
    _log_llm("ELAPSED", f"{(time.perf_counter()-t0)*1000:.1f}ms")

    plan = []
    try:
        m = re.search(r"\[[\s\S]*\]", response.content, re.DOTALL)
        if m:
            raw_plan = json.loads(m.group())
            for item in raw_plan:
                plan.append({
                    "step": item.get("step", 0),
                    "action": item.get("action", ""),
                    "tool": item.get("tool"),
                    "args": item.get("args", {}),
                    "needs_input": item.get("needs_input", False),
                    "status": "pending",
                })
    except Exception as e:
        _log_agent("PLAN_PARSE_ERROR", str(e))

    _log_agent("PLAN_STEPS", f"共 {len(plan)} 个步骤:")
    for step in plan:
        _log_agent(
            f"  step_{step['step']}",
            f"{step['action']} | tool={step['tool'] or 'N/A'} | "
            f"args={json.dumps(step['args'], ensure_ascii=False)[:80]}"
        )

    return {
        "plan": plan,
        "current_step": 0,
        "step_results": [],
        "needs_confirmation": False,
        "confirmation_message": "",
    }


# ─────────────────────────────────────────────
# Node 2: 确认节点
# ─────────────────────────────────────────────
def confirm_node(state: AgentState) -> AgentState:
    """生成用户确认信息。chat 和纯分析计划无需确认。"""
    intent = state.get("intent", "")
    plan = state.get("plan", [])
    original_input = state.get("original_input", "")

    _section("确认节点", "─", 70)

    if intent == "chat" or not plan:
        _log_agent("CONFIRM", "无需确认")
        return {"needs_confirmation": False, "confirmation_message": ""}

    # 全部为纯分析步骤，无需工具 → 无需确认
    if all(step.get("tool") is None for step in plan):
        _log_agent("CONFIRM", "全部纯分析，无需确认")
        return {"needs_confirmation": False, "confirmation_message": ""}

    steps_text = "\n".join(
        f"{i+1}. **{step['action']}**"
        + (f" → 调用 `{step['tool']}`" if step.get("tool") else "（纯分析）")
        for i, step in enumerate(plan)
    )

    message = (
        f"我将执行以下操作来帮你完成「{original_input}」：\n\n"
        f"{steps_text}\n\n"
        f"确认执行？（输入「是」「Y」「确认」执行，其他输入取消）"
    )

    _log_agent("CONFIRM", "需要确认")
    _log_agent("CONFIRM_MSG", message[:200])
    return {"needs_confirmation": True, "confirmation_message": message}


# ─────────────────────────────────────────────
# Node 3: 执行器（async，分离出主循环，由外部 await）
# ─────────────────────────────────────────────
async def run_executor(state: AgentState, mcp_client: MCPClient) -> AgentState:
    """
    核心执行器：按顺序执行 plan 中的每个步骤。
    - 工具调用：MCP call_tool
    - 纯分析：LLM 直接分析
    - 容错：每步失败最多重试 1 次，继续后续步骤
    """
    from langchain_core.messages import HumanMessage

    plan = state.get("plan", [])
    current_step = state.get("current_step", 0)
    step_results = list(state.get("step_results", []))
    original_input = state.get("original_input", "")

    _section("执行器", "─", 70)

    if not plan:
        _log_agent("EXECUTOR", "计划为空")
        return {"step_results": [], "current_step": 0}

    for step_item in plan[current_step:]:
        step_num = step_item["step"]
        action = step_item["action"]
        tool_name = step_item.get("tool")
        args = step_item.get("args", {})

        _log_agent(f"STEP_{step_num}", f"执行: {action}")

        result_entry = {
            "step": step_num,
            "action": action,
            "tool": tool_name,
            "result": "",
            "success": False,
            "error": None,
        }

        # ── 纯分析步骤 ──
        if tool_name is None:
            t0 = time.perf_counter()
            response = _get_llm().invoke([
                HumanMessage(
                    content=f"用户请求：「{original_input}」\n"
                            f"步骤：{action}\n请简洁分析。"
                )
            ])
            result_entry["result"] = response.content.strip()
            result_entry["success"] = True
            _log_agent(f"STEP_{step_num}_ANALYSIS",
                       f"完成，耗时 {(time.perf_counter()-t0)*1000:.1f}ms")
            step_results.append(result_entry)
            current_step = step_num
            continue

        # ── 工具调用步骤（最多重试 1 次） ──
        for attempt in range(2):
            t0 = time.perf_counter()
            raw_result = await mcp_client.call_tool(tool_name, args)
            elapsed_ms = (time.perf_counter() - t0) * 1000

            is_error = (
                raw_result.startswith("[MCP")
                or raw_result.startswith("[HTTP")
                or raw_result.startswith("[错误")
                or not raw_result.strip()
            )

            if not is_error:
                result_entry["result"] = raw_result
                result_entry["success"] = True
                _log_tool(f"STEP_{step_num}_OK", f"成功，耗时 {elapsed_ms:.1f}ms")
                _log_tool("  preview", raw_result[:200].replace('\n', ' '))
                break
            else:
                if attempt == 0:
                    _log_retry("RETRY", f"step_{step_num} 失败，将重试")
                else:
                    result_entry["error"] = raw_result
                    result_entry["result"] = f"[执行失败] {raw_result}"
                    _log_retry("STEP_FAILED", f"step_{step_num} 最终失败: {raw_result[:100]}")

        step_results.append(result_entry)
        current_step = step_num

        if not result_entry["success"]:
            _log_agent("STEP_FAILED_CONTINUE", f"step_{step_num} 失败，继续执行后续步骤")

    success_count = sum(1 for r in step_results if r["success"])
    total_count = len(step_results)
    _log_agent("EXECUTOR_DONE",
               f"{success_count}/{total_count} 步骤成功")

    return {
        "step_results": step_results,
        "current_step": current_step,
    }


# ─────────────────────────────────────────────
# Node 4: 结果合成器
# ─────────────────────────────────────────────
def synthesizer_node(state: AgentState) -> AgentState:
    """
    将执行结果格式化为自然语言回复。
    - chat：LLM 直接生成
    - 其他：格式化执行结果
    """
    from langchain_core.messages import HumanMessage

    intent = state.get("intent", "chat")
    original_input = state.get("original_input", "")
    step_results = list(state.get("step_results", []))

    _section("结果合成", "─", 70)

    # ── chat 类型 ──
    if intent == "chat" and not step_results:
        _log_agent("SYNTHESIZER", "chat → LLM 直接回复")
        t0 = time.perf_counter()
        response = _get_llm().invoke([
            HumanMessage(content=f"用户说：「{original_input}」\n\n"
                                  "你是 Link-Do 助手，帮助管理任务、专注计时、Notion 同步。"
                                  "请友好、简洁地回复。")
        ])
        _log_llm("SYNTHESIZED", f"耗时 {(time.perf_counter()-t0)*1000:.1f}ms")
        return {"final_reply": response.content.strip()}

    # ── 执行结果汇总 ──
    if step_results:
        total = len(step_results)
        success = sum(1 for r in step_results if r["success"])
        failed = total - success

        lines = []
        for r in step_results:
            emoji = "✅" if r["success"] else "❌"
            tool_tag = f"[{r['tool']}]" if r["tool"] else ""
            preview = (r["result"] or r.get("error", ""))[:300]
            lines.append(
                f"{emoji} **步骤 {r['step']}：{r['action']}** {tool_tag}\n"
                f"   {preview}"
            )

        summary = (
            f"已完成 {success}/{total} 个步骤"
            + (f"，{failed} 个失败" if failed else "，全部成功")
            + f"\n\n" + "\n\n".join(lines)
        )
        _log_agent("SUMMARY", summary[:300].replace('\n', ' '))
        return {"final_reply": summary}

    return {"final_reply": "好的，已处理完成。有其他需要帮助的吗？"}


# ─────────────────────────────────────────────
# 路由函数
# ─────────────────────────────────────────────
def route_after_classifier(state: AgentState) -> str:
    intent = state.get("intent", "chat")
    _log_agent("ROUTE", f"classifier → {'chat' if intent == 'chat' else 'planner'}")
    return "chat_fallback" if intent == "chat" else "planner"


def route_after_confirm(state: AgentState) -> str:
    needs = state.get("needs_confirmation", False)
    _log_agent("ROUTE", f"confirm → {'needs_confirm' if needs else 'skip_confirm'}")
    return "needs_confirm" if needs else "skip_confirm"


# ─────────────────────────────────────────────
# 编译 LangGraph
# ─────────────────────────────────────────────
from langgraph.graph import StateGraph, END


def build_graph(mcp_client: MCPClient):
    """
    LangGraph v2 架构：

    classifier ──┬── intent=chat ──→ chat_fallback ──→ END
                 │
                 └── intent≠chat ──→ planner ──→ confirm ──┬── needs_confirm=True ──→ [外部等待] ──→ executor（外部await）
                                                            │
                                                            └── needs_confirm=False ──→ executor（外部await）
                                                                                           │
                                                                                           └── synthesizer ──→ END

    executor 是 async 函数，不作为 LangGraph 节点，
    而是由主循环 await 后再进入 synthesizer。
    """
    def classifier_w(state: AgentState) -> AgentState:
        return intent_classifier(state, mcp_client)

    graph = StateGraph(AgentState)

    # ── 节点 ──
    graph.add_node("classifier", classifier_w)
    graph.add_node("planner", planner_node)
    graph.add_node("confirm", confirm_node)
    graph.add_node("chat_fallback", synthesizer_node)   # 复用 synthesizer（chat 模式）
    graph.add_node("skip_confirm", lambda s: s)         # 空节点，跳过等待

    # ── 入口 ──
    graph.set_entry_point("classifier")

    # ── classifier 路由 ──
    graph.add_conditional_edges(
        "classifier",
        route_after_classifier,
        {
            "chat_fallback": "chat_fallback",
            "planner": "planner",
        },
    )
    graph.add_edge("chat_fallback", END)

    # ── planner → confirm ──
    graph.add_edge("planner", "confirm")

    # ── confirm 路由 ──
    graph.add_conditional_edges(
        "confirm",
        route_after_confirm,
        {
            "needs_confirm": "needs_confirm",
            "skip_confirm": "skip_confirm",
        },
    )

    # ── needs_confirm：暂停节点，等待外部处理 ──
    graph.add_node("needs_confirm", lambda s: s)
    graph.add_edge("needs_confirm", END)  # 主循环会接管后续流程
    graph.add_edge("skip_confirm", END)    # 主循环会接管后续流程

    return graph.compile()


# ─────────────────────────────────────────────
# 交互式运行（主循环 + 人类在环）
# ─────────────────────────────────────────────
async def run_interactive():
    _banner("Link-Do 智能助手 (DeepSeek + MCP + LangGraph v2)")
    print("  输入 exit / quit / q 退出\n")

    _section("阶段 1/3: MCP 连接", "─", 70)
    _log_step("MCP_BASE_URL", MCP_BASE_URL)
    _log_step("MCP_TOKEN", f"{'已设置 (' + str(len(MCP_TOKEN)) + ' chars)' if MCP_TOKEN else '未设置'}")

    t0 = time.perf_counter()
    mcp_client = await get_mcp_client()
    _log_step("CONNECT_TIME", f"{(time.perf_counter()-t0)*1000:.0f}ms")

    _banner("连接成功，进入对话循环")

    graph = build_graph(mcp_client)

    # 打印图结构
    print("""
  [GRAPH] LangGraph v2 节点架构:
           ┌──────────────────────────────────────────────────────┐
           │  classifier → 意图分类（规则引擎优先 + LLM 兜底）   │
           │       │                                                │
           │       ├── intent=chat  → chat_fallback → END         │
           │       │                                                │
           │       └── intent≠chat → planner → confirm             │
           │                             │                          │
           │       ┌─────────────────────┤                          │
           │       │ needs_confirm       │ skip_confirm           │
           │       ▼                      ▼                         │
           │  [主循环接管]           [主循环接管]                   │
           │       │                      │                         │
           │       └──────────┬───────────┘                         │
           │                  ▼                                     │
           │             run_executor() ← async 执行器（外部 await）│
           │                  │                                     │
           │                  ▼                                     │
           │             synthesizer → END                         │
           └──────────────────────────────────────────────────────┘
""")

    turn = 0
    while True:
        turn += 1
        user_input = input("\n你: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "q"):
            print("再见！")
            break

        _section(f"对话回合 #{turn}", "═", 70)
        _log_step("USER_INPUT", user_input[:150])

        # ── 初始状态 ──
        state: AgentState = {
            "messages": [],
            "original_input": user_input,
            "intent": "chat",
            "intent_confidence": "low",
            "intent_reason": "",
            "plan": [],
            "current_step": 0,
            "step_results": [],
            "needs_confirmation": False,
            "confirmation_message": "",
            "final_reply": "",
            "mcp_client": mcp_client,
        }

        # ── 阶段 A：LangGraph（分类 + 规划 + 确认决策） ──
        _section("阶段 A: 分类 + 规划 + 确认", "─", 70)
        t_graph = time.perf_counter()
        result = graph.invoke(state)
        elapsed_graph = (time.perf_counter() - t_graph) * 1000
        state = dict(result)

        _log_step("GRAPH_TIME", f"{elapsed_graph:.1f}ms")
        _log_agent("INTENT", f"{state['intent']} ({state['intent_confidence']})")
        _log_agent("PLAN", f"{len(state.get('plan', []))} 个步骤")
        _log_agent("NEEDS_CONFIRM", str(state.get("needs_confirmation", False)))

        # ── 阶段 B：需要确认时等待用户 ──
        if state.get("needs_confirmation"):
            print(f"\n  ╔══════════════════════════════════════╗")
            print(f"  ║  助手（请确认）                     ║")
            print(f"  ╚══════════════════════════════════════╝")
            print(state.get("confirmation_message", ""))

            confirm = input("\n> 请输入（是/Y/确认 确认，其他取消）: ").strip()
            confirmed = confirm.lower() in ("是", "y", "确认", "执行", "好", "ok", "yes")
            _log_tool("USER_CONFIRM", f"{confirm} → {'✅ 确认' if confirmed else '❌ 取消'}")

            if not confirmed:
                print("\n助手: 已取消。有其他需要帮助的吗？")
                turn -= 1
                continue

        # ── 阶段 C：执行器（async） ──
        intent = state.get("intent", "chat")
        if intent != "chat":
            _section("阶段 C: 执行中", "─", 70)
            exec_result = await run_executor(state, mcp_client)
            state = {**state, **exec_result}

        # ── 阶段 D：合成回复 ──
        _section("阶段 D: 合成回复", "─", 70)
        syn_result = synthesizer_node(state)
        state = {**state, **syn_result}

        # ── 打印最终回复 ──
        _log_agent("FINAL_REPLY",
                   state.get("final_reply", "（无回复）")[:200].replace('\n', ' '))
        print(f"\n\n  ╔══════════════════════════════════════╗")
        print(f"  ║  助手回复                             ║")
        print(f"  ╚══════════════════════════════════════╝")
        print(state.get("final_reply", "（无回复）"))

    await mcp_client.close()
    _banner("会话已结束")


if __name__ == "__main__":
    try:
        asyncio.run(run_interactive())
    except KeyboardInterrupt:
        print("\n已退出。")
