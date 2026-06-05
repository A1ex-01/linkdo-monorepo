"""
LangGraph 节点实现 — 对标 base.py 的完整 agent 编排逻辑。

节点定义（与 base.py 一一对应）：
  intent_classifier   → 意图分类（规则引擎优先 + LLM 兜底）
  planner_node        → 任务规划（LLM 拆解步骤）
  confirm_node        → 确认节点（生成确认消息）
  run_executor       → 执行器（async，外部 await 后结果写回 state）
  synthesizer_node    → 结果合成（格式化回复）

路由函数：
  route_after_classifier → intent=chat → END，intent≠chat → planner
  route_after_confirm    → needs_confirm → END（外部接管），否则 skip_confirm → END（外部接管）
"""

from __future__ import annotations

import json
import re
import time
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncIterator,
    TypedDict,
)

from app.agent.client import MCPClient
from app.utils.logger import get_logger

if TYPE_CHECKING:
    pass


logger = get_logger(__name__)


def _traceable_if_enabled(fn: Any, run_type: str = "chain") -> Any:
    """
    条件装饰器：如果 LangSmith 已配置则应用 @traceable，否则原样返回函数。
    避免在未配置时引入任何额外开销。
    """
    from app.tracing import is_tracing_enabled
    if is_tracing_enabled():
        from langsmith import traceable
        return traceable(run_type=run_type)(fn)
    return fn


# ─────────────────────────────────────────────────────────────────────────────
# 全局 LLM 实例（lazy init）
# ─────────────────────────────────────────────────────────────────────────────

_llm: Any = None


def _get_llm() -> Any:
    global _llm
    if _llm is None:
        from app.tracing import is_tracing_enabled
        from app.config import settings

        if is_tracing_enabled():
            from app.tracing import traced_llm
            _llm = traced_llm()
        else:
            from langchain_deepseek import ChatDeepSeek
            _llm = ChatDeepSeek(
                model=settings.llm.model,
                api_key=settings.llm.api_key,
                api_base=settings.llm.base_url,
                temperature=settings.llm.temperature,
            )
    return _llm


# ─────────────────────────────────────────────────────────────────────────────
# 节点输出类型别名（用于 graph.add_node 类型注解）
# ─────────────────────────────────────────────────────────────────────────────

IntentClassifierOutput = dict[str, Any]
PlannerOutput = dict[str, Any]
ConfirmOutput = dict[str, Any]
ExecutorOutput = dict[str, Any]
SynthesizerOutput = dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# 规则引擎：基于关键词的意图分类
# ─────────────────────────────────────────────────────────────────────────────

def _rules_classify(text: str) -> dict | None:
    """
    基于关键词的规则引擎意图分类。
    返回 None 表示无法匹配，需要降级到 LLM。
    """
    t = text.lower()

    if any(k in t for k in [
        "notion", "collection", "workspace", "notion 数据库",
        "notion db", "同步", "哪个 collection", "看看 collection",
    ]):
        return {"intent": "notion", "confidence": "high",
                "reason": "命中关键词: notion/collection"}

    if any(k in t for k in [
        "计时", "番茄", "focus", "开始计时", "停止计时",
        "专注", "计时器", "pomodoro",
    ]):
        return {"intent": "timer", "confidence": "high",
                "reason": "命中关键词: timer/focus"}

    if any(k in t for k in [
        "任务", "todo", "task", "查看任务", "创建任务", "新建任务",
        "更新任务", "删除任务", "move", "移到", "标记完成", "标记为",
        "帮我看看", "显示", "list", "列表", "今天有哪些",
    ]):
        return {"intent": "task", "confidence": "high",
                "reason": "命中关键词: task"}

    if any(k in t for k in [
        "自动", "规则", "workflow", "when", "if", "触发",
        "自动化", "配置", "提醒", "通知",
    ]):
        return {"intent": "flow", "confidence": "high",
                "reason": "命中关键词: flow"}

    return None


# ─────────────────────────────────────────────────────────────────────────────
# Node 0: 意图分类
# ─────────────────────────────────────────────────────────────────────────────

@is_tracing_enabled  # type: ignore[misc]
def intent_classifier(state: dict, mcp_client: MCPClient) -> IntentClassifierOutput:
    """
    两层分类：
    1. 规则引擎（关键词匹配，置信度 high）
    2. LLM 兜底（复杂/模糊输入，置信度 medium/low）
    """
    from langchain_core.messages import HumanMessage

    original_input = state.get("original_input", "")
    logger.info("agent_intent_classify", input=original_input[:100])

    # ── 规则引擎优先 ──
    rules_result = _rules_classify(original_input)
    if rules_result:
        logger.info("agent_rules_match", intent=rules_result["intent"],
                    confidence=rules_result["confidence"])
        return {
            "intent": rules_result["intent"],
            "intent_confidence": rules_result["confidence"],
            "intent_reason": rules_result["reason"],
        }

    logger.info("agent_rules_miss", msg="降级到 LLM 分类")

    # ── LLM 兜底分类 ──
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
    logger.info("agent_llm_classify", elapsed_ms=f"{(time.perf_counter()-t0)*1000:.0f}ms",
                response=response.content.strip()[:200])

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

    return {
        "intent": intent,
        "intent_confidence": confidence,
        "intent_reason": reason or "LLM 分类",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 1: 任务规划器
# ─────────────────────────────────────────────────────────────────────────────

def planner_node(state: dict, mcp_client: MCPClient) -> PlannerOutput:
    """
    根据 intent 生成可执行步骤计划。
    - chat: 无需规划，直接跳过
    - task/notion/timer/flow: LLM 拆解步骤
    """
    from langchain_core.messages import HumanMessage

    intent = state.get("intent", "chat")
    original_input = state.get("original_input", "")
    logger.info("agent_planner", intent=intent, input=original_input[:100])

    if intent == "chat":
        return {
            "plan": [],
            "current_step": 0,
            "step_results": [],
            "needs_confirmation": False,
            "confirmation_message": "",
        }

    # ── LLM 规划 ──
    tool_schemas = mcp_client.tool_schemas
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
  {{"step": 1, "action": "操作描述", "tool": "工具名|null", "args": {{"参数": "值"}}}},
  ...
]

只输出 JSON。"""

    t0 = time.perf_counter()
    response = _get_llm().invoke([HumanMessage(content=planning_prompt)])
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info("agent_plan_llm", elapsed_ms=f"{elapsed_ms:.0f}ms",
                response=response.content.strip()[:300])

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
        logger.error("agent_plan_parse_error", error=str(e))

    logger.info("agent_plan_steps", count=len(plan))
    for step in plan:
        logger.debug("agent_plan_step", step=step.get("step"),
                     action=step.get("action"),
                     tool=step.get("tool"))

    return {
        "plan": plan,
        "current_step": 0,
        "step_results": [],
        "needs_confirmation": False,
        "confirmation_message": "",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 2: 确认节点
# ─────────────────────────────────────────────────────────────────────────────

def confirm_node(state: dict) -> ConfirmOutput:
    """
    生成用户确认信息。
    - chat 无需确认
    - 全部为纯分析步骤无需确认
    - 需要工具调用的计划需要确认
    """
    intent = state.get("intent", "")
    plan = state.get("plan", [])
    original_input = state.get("original_input", "")

    logger.info("agent_confirm", intent=intent, plan_len=len(plan))

    if intent == "chat" or not plan:
        return {"needs_confirmation": False, "confirmation_message": ""}

    # 全部为纯分析步骤，无需工具 → 无需确认
    if all(step.get("tool") is None for step in plan):
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

    logger.info("agent_confirm_needed", message=message[:200])
    return {"needs_confirmation": True, "confirmation_message": message}


# ─────────────────────────────────────────────────────────────────────────────
# 执行器辅助：上一步结果注入 & LLM 引用解析
# ─────────────────────────────────────────────────────────────────────────────

def _contains_unresolved_placeholder(args: dict) -> bool:
    """检查 args 中是否还有未解析的占位符引用。"""
    import re
    for v in args.values():
        if not isinstance(v, str):
            continue
        if re.search(r"由上一步|上一步的|{{.*}}|from previous|prev|上一步返回|上一步获取", v, re.IGNORECASE):
            return True
    return False


def _resolve_step_references(args: dict, step_results: list[dict]) -> dict:
    """
    简单替换：处理 {{xxx}} 模板语法。
    例如 {{上一步返回的第一个collection.uuid}} → 解析 step_results 提取真实值。
    """
    import re
    resolved = dict(args)
    for k, v in resolved.items():
        # 处理 null 值：如果字段为 null，尝试从 step_results 提取
        if v is None:
            replacement = _extract_from_step_results(k, step_results)
            if replacement:
                resolved[k] = replacement
            continue
        if not isinstance(v, str):
            continue
        # 处理 {{...}} 模板格式
        tmpl_matches = re.findall(r"\{\{([^}]+)\}\}", v)
        if tmpl_matches:
            for tmpl in tmpl_matches:
                replacement = _extract_from_step_results(tmpl.strip(), step_results)
                if replacement:
                    v = re.sub(r"\{\{" + re.escape(tmpl) + r"\}\}", replacement, v)
        resolved[k] = v
    return resolved


def _extract_from_step_results(pattern: str, step_results: list[dict]) -> str | None:
    """从 step_results 中提取匹配 pattern 的值。"""
    import re

    pattern_lower = pattern.lower()

    # 匹配 "collection.uuid" / "task.id" / "第一个 collection" 等字段提取
    field_match = re.search(
        r"(?:第一个|第二个|第一个的|第二个的|上一步返回的)?(.+?)(?:\.uuid|\.id|\.name|\.title)?$",
        pattern_lower,
    )
    target_field = field_match.group(1).strip() if field_match else pattern_lower

    # 从最新的 step_result 开始往前找
    for r in reversed(step_results):
        raw = r.get("result", "")
        if not raw:
            continue

        # 去掉 markdown code block 包裹
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        cleaned = re.sub(r"\s*```$", "", cleaned)

        # 尝试从 JSON 结果中提取
        try:
            data = json.loads(cleaned)
            if isinstance(data, dict):
                # 尝试直接找 uuid/id
                for key in ["uuid", "id"]:
                    if key in data:
                        return str(data[key])
                # 尝试找 collections/tasks 等列表字段
                for list_key in ["collections", "tasks", "items", "data", "result"]:
                    if list_key in data and isinstance(data[list_key], list) and len(data[list_key]) > 0:
                        first = data[list_key][0]
                        for key in ["uuid", "id", "name", "title", "collection_uuid"]:
                            if key in first:
                                return str(first[key])
            elif isinstance(data, list) and len(data) > 0:
                # 列表：取第一个或匹配项
                first = data[0]
                for key in ["uuid", "id", "name", "title", "collection_uuid"]:
                    if key in first:
                        return str(first[key])
                return str(first)
        except Exception:
            pass

        # 兜底：文本中直接找 UUID
        uuid_m = re.search(
            r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
            raw, re.I
        )
        if uuid_m:
            return uuid_m.group()

    return None


async def _llm_resolve_args(
    tool_name: str,
    args: dict,
    action: str,
    original_input: str,
    step_results: list[dict],
    llm: Any,
) -> dict:
    """
    当 args 中存在「由上一步获取的 XXX」这类未解析引用时，
    用 LLM 从 step_results 中解析出实际值。
    """
    from langchain_core.messages import HumanMessage

    context_lines = []
    for r in step_results:
        context_lines.append(
            f"步骤 {r['step']} [{r['action']}] "
            + (f"工具={r['tool']} " if r.get("tool") else "")
            + f"结果: {r.get('result', '')[:500]}"
        )
    context = "\n".join(context_lines) if context_lines else "（无上一步结果）"

    prompt = f"""你是 Link-Do 任务助手。当前要执行的工具调用参数还未完全填好。

工具名: {tool_name}
动作描述: {action}
用户原始请求: {original_input}

上一步及更早的步骤执行结果:
{context}

当前 args（含有未解析引用）:
{json.dumps(args, ensure_ascii=False, indent=2)}

请根据上一步的结果，解析出「由上一步获取的 XXX」或 {{xxx}} 这类引用的实际值。
只输出完整的 JSON 参数对象，不要任何其他文字。

规则:
- 如果上一步返回了 collection_uuid/task_id 等，直接填入对应字段
- 如果上一步返回的是列表（如获取 collection 列表），选取最匹配的一个（如第一个）
- **重要：每个字段必须填入真实值，不要填 null**
- 如果无法从结果中解析出需要的值，必须返回 {{"error": "无法从上下文解析出 xxx"}} 的 JSON
- 不要输出 null、None 或空值，如果某个字段确实无法解析，整条返回 error JSON
- 只输出 JSON，不要 markdown 代码块，不要任何其他文字"""

    t0 = time.perf_counter()
    response = llm.invoke([HumanMessage(content=prompt)])
    elapsed = (time.perf_counter() - t0) * 1000
    logger.info("agent_llm_resolve_args", tool=tool_name, elapsed_ms=f"{elapsed:.0f}ms",
                preview=response.content.strip()[:200])

    try:
        m = re.search(r"\{[\s\S]*\}", response.content, re.DOTALL)
        if m:
            parsed = json.loads(m.group())
            if "error" not in parsed and not _has_null_values(parsed):
                logger.info("agent_args_resolved", resolved=json.dumps(parsed, ensure_ascii=False)[:200])
                return parsed
    except Exception as e:
        logger.error("agent_llm_resolve_error", error=str(e))

    return args  # 解析失败返回原 args


def _has_null_values(d: dict) -> bool:
    """检查 dict 中是否有 null 值（LLM 解析失败时常返回 null）。"""
    for v in d.values():
        if v is None:
            return True
        if isinstance(v, dict):
            if _has_null_values(v):
                return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# Node 3: 执行器（async，外部 await）
# ─────────────────────────────────────────────────────────────────────────────

async def run_executor(
    state: dict,
    mcp_client: MCPClient,
) -> ExecutorOutput:
    """
    核心执行器：按顺序执行 plan 中的每个步骤。
    - 工具调用：MCP call_tool
    - 纯分析：LLM 直接分析
    - 容错：每步失败最多重试 1 次，继续后续步骤
    """
    from langchain_core.messages import HumanMessage

    plan = state.get("plan", [])
    current_step = state.get("current_step", 0)
    step_results: list[dict] = list(state.get("step_results", []))
    original_input = state.get("original_input", "")

    logger.info("agent_executor", plan_len=len(plan))

    if not plan:
        return {"step_results": [], "current_step": 0}

    for step_item in plan[current_step:]:
        step_num = step_item["step"]
        action = step_item["action"]
        tool_name = step_item.get("tool")
        args = step_item.get("args", {})

        logger.info("agent_execute_step", step=step_num, action=action, tool=tool_name)

        result_entry: dict[str, Any] = {
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
            logger.info("agent_step_analysis_done", step=step_num,
                        elapsed_ms=f"{(time.perf_counter()-t0)*1000:.0f}ms")
            step_results.append(result_entry)
            current_step = step_num
            continue

        # ── 工具调用步骤（最多重试 1 次） ──
        for attempt in range(2):
            # 首次尝试时解析上一步引用，重试时保持不变
            if attempt == 0:
                resolved_args = _resolve_step_references(args, step_results)
                # ── LLM 进一步解析引用（如 "由上一步获取的 Collection UUID"）───
                if _contains_unresolved_placeholder(resolved_args):
                    resolved_args = await _llm_resolve_args(
                        tool_name, resolved_args, action, original_input, step_results, _get_llm()
                    )

            t0 = time.perf_counter()
            raw_result = await mcp_client.call_tool(tool_name, resolved_args)
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
                logger.info("agent_step_ok", step=step_num, elapsed_ms=f"{elapsed_ms:.0f}ms",
                            preview=raw_result[:100].replace("\n", " "))
                break
            else:
                if attempt == 0:
                    logger.warning("agent_step_retry", step=step_num, error=raw_result[:100])
                else:
                    result_entry["error"] = raw_result
                    result_entry["result"] = f"[执行失败] {raw_result}"
                    logger.error("agent_step_failed", step=step_num, error=raw_result[:100])

        step_results.append(result_entry)
        current_step = step_num

        if not result_entry["success"]:
            logger.warning("agent_step_failed_continue", step=step_num)

    success_count = sum(1 for r in step_results if r["success"])
    total_count = len(step_results)
    logger.info("agent_executor_done", success=success_count, total=total_count)

    return {
        "step_results": step_results,
        "current_step": current_step,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 4: 结果合成器
# ─────────────────────────────────────────────────────────────────────────────

def synthesizer_node(state: dict) -> SynthesizerOutput:
    """
    将执行结果格式化为自然语言回复。
    - chat：LLM 直接生成
    - 其他：格式化执行结果
    """
    from langchain_core.messages import HumanMessage

    intent = state.get("intent", "chat")
    original_input = state.get("original_input", "")
    step_results: list[dict] = list(state.get("step_results", []))

    logger.info("agent_synthesizer", intent=intent, step_results=len(step_results))

    # ── chat 类型 ──
    if intent == "chat" and not step_results:
        t0 = time.perf_counter()
        response = _get_llm().invoke([
            HumanMessage(content=f"用户说：「{original_input}」\n\n"
                                  "你是 Link-Do 助手，帮助管理任务、专注计时、Notion 同步。"
                                  "请友好、简洁地回复。")
        ])
        logger.info("agent_synth_chat", elapsed_ms=f"{(time.perf_counter()-t0)*1000:.0f}ms")
        return {"final_reply": response.content.strip()}

    # ── 执行结果汇总 ──
    if step_results:
        total = len(step_results)
        success = sum(1 for r in step_results if r["success"])
        failed = total - success

        lines = []
        for r in step_results:
            emoji = "✅" if r["success"] else "❌"
            tool_tag = f"[{r['tool']}]" if r.get("tool") else ""
            preview = (r.get("result") or r.get("error", ""))[:300]
            lines.append(
                f"{emoji} **步骤 {r['step']}：{r['action']}** {tool_tag}\n"
                f"   {preview}"
            )

        summary = (
            f"已完成 {success}/{total} 个步骤"
            + (f"，{failed} 个失败" if failed else "，全部成功")
            + f"\n\n" + "\n\n".join(lines)
        )
        logger.info("agent_synth_summary", summary=summary[:200].replace("\n", " "))
        return {"final_reply": summary}

    return {"final_reply": "好的，已处理完成。有其他需要帮助的吗？"}


# ─────────────────────────────────────────────────────────────────────────────
# 路由函数
# ─────────────────────────────────────────────────────────────────────────────

def route_after_classifier(state: dict) -> str:
    """classifier 路由：chat → END，否则 → planner"""
    intent = state.get("intent", "chat")
    return "chat_fallback" if intent == "chat" else "planner"


def route_after_confirm(state: dict) -> str:
    """confirm 路由：needs_confirm=True → needs_confirm（外部接管），否则 skip_confirm（外部接管）"""
    needs = state.get("needs_confirmation", False)
    return "needs_confirm" if needs else "skip_confirm"


# ─────────────────────────────────────────────────────────────────────────────
# LangSmith 追踪：条件应用 @traceable（惰性，仅在 LangSmith 已配置时生效）
# ─────────────────────────────────────────────────────────────────────────────

intent_classifier = _traceable_if_enabled(intent_classifier, run_type="chain")
planner_node = _traceable_if_enabled(planner_node, run_type="chain")
synthesizer_node = _traceable_if_enabled(synthesizer_node, run_type="chain")


__all__ = [
    "intent_classifier",
    "planner_node",
    "confirm_node",
    "run_executor",
    "synthesizer_node",
    "route_after_classifier",
    "route_after_confirm",
    "IntentClassifierOutput",
    "PlannerOutput",
    "ConfirmOutput",
    "ExecutorOutput",
    "SynthesizerOutput",
    "_traceable_if_enabled",
]
