"""
Chat API 路由 — LangGraph v2 Agent 驱动。

完整流程（与 base.py run_interactive() 一致）：
  1. intent_classifier → 意图分类
  2. 若 intent=chat → synthesizer → 直接回复
  3. 若 intent≠chat → planner → confirm
     - confirm=true：返回确认事件，前端展示
     - confirm=false：直接执行
  4. run_executor()（async）执行计划
  5. synthesizer() 合成最终回复并流式 SSE 输出
"""

from __future__ import annotations

import json
import uuid
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from app.agent.nodes import run_executor, synthesizer_node
from app.api.dependencies import verify_api_key
from app.api.schemas import (
    ChatRequest,
    ConfirmRequired,
    PlanStep,
    StreamDone,
    StreamError,
    StreamText,
)
from app.utils.logger import get_logger
import app.runtime_state as runtime_state

logger = get_logger(__name__)

router = APIRouter(prefix="/v1", tags=["chat"])

# 内存中的 pending plan（两阶段确认用）
_pending_sessions: dict[str, dict] = {}


# ─────────────────────────────────────────────────────────────────────────────
# SSE 事件工具
# ─────────────────────────────────────────────────────────────────────────────

def sse_event(event: str, data: dict) -> dict:
    return {
        "event": event,
        "data": json.dumps(data, ensure_ascii=False),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 文本流式 helper
# ─────────────────────────────────────────────────────────────────────────────

def _stream_text(text: str) -> AsyncIterator[dict]:
    """将文本按行切分为累积流。"""
    accumulated = ""
    for segment in text.split("\n"):
        accumulated = (accumulated + "\n" + segment).strip()
        yield sse_event("text", StreamText(
            type="text",
            content=accumulated,
        ).model_dump())


# ─────────────────────────────────────────────────────────────────────────────
# Agent 运行（核心逻辑，对标 base.py 主循环）
# ─────────────────────────────────────────────────────────────────────────────

def _build_initial_state(user_input: str, mcp_client: Any) -> dict[str, Any]:
    """构建初始 AgentState。"""
    return {
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


async def agent_run(
    user_input: str,
    mcp_client: Any,
    compiled_graph: Any,
    initial_state: dict[str, Any] | None = None,
    session_id: str | None = None,
) -> AsyncIterator[dict]:
    """
    运行完整的 LangGraph Agent 流程，yield SSE 事件。

    流程（对标 base.py run_interactive）：
      1. intent_classifier → 意图分类
      2. 若 chat → synthesizer → 直接回复
      3. 若 intent≠chat → planner → confirm
         - needs_confirm=True：yield confirm 事件
         - needs_confirm=False：直接执行
      4. run_executor()（async）执行计划
      5. synthesizer() → final_reply
      6. 流式 yield final_reply + done
    """
    logger.info("agent_run_start", user_input=user_input[:100])

    sid = session_id or str(uuid.uuid4())
    state = initial_state or _build_initial_state(user_input, mcp_client)

    # ── LangSmith tracer config（注入 metadata）────────────────────────────
    from app.tracing import get_tracer_config
    tracer_config = get_tracer_config(metadata={"session_id": sid})

    # ── 阶段 A：分类 + 规划 + 确认（LangGraph invoke）────────────────────
    graph_result = compiled_graph.invoke(state, config=tracer_config)
    state = dict(graph_result)

    intent = state.get("intent", "chat")
    needs_confirm = state.get("needs_confirmation", False)

    logger.info("agent_phase_a_done", intent=intent, needs_confirm=needs_confirm,
                plan_len=len(state.get("plan", [])))

    # ── chat 类型：直接生成回复 ─────────────────────────────────────────
    if intent == "chat":
        syn = synthesizer_node(state)
        final_reply = syn.get("final_reply", "")
        for chunk in _stream_text(final_reply):
            yield chunk
        yield sse_event("done", {"type": "done", "session_id": "", "message": final_reply})
        return

    # ── 需要确认 ────────────────────────────────────────────────────────
    if needs_confirm and state.get("plan"):
        # 保存状态，等待前端确认
        _pending_sessions[sid] = state
        plan_steps = [
            PlanStep(
                step=s["step"],
                action=s["action"],
                tool=s.get("tool"),
                args=s.get("args"),
            )
            for s in state.get("plan", [])
        ]
        yield sse_event("confirm", ConfirmRequired(
            type="confirm_required",
            intent=intent,
            summary=state.get("intent_reason", ""),
            steps=plan_steps,
            session_id=sid,
        ).model_dump())
        return

    # ── 直接执行（needs_confirm=False 或纯分析计划）──────────────────────
    exec_result = await run_executor(state, mcp_client)
    state = {**state, **exec_result}

    syn_result = synthesizer_node(state)
    final_reply = syn_result.get("final_reply", "")

    logger.info("agent_final_reply", reply=final_reply[:200].replace("\n", " "))

    for chunk in _stream_text(final_reply):
        yield chunk

    yield sse_event("done", {"type": "done", "session_id": "", "message": final_reply})


# ─────────────────────────────────────────────────────────────────────────────
# 两阶段确认：执行已确认的计划
# ─────────────────────────────────────────────────────────────────────────────

async def agent_run_confirmed(state: dict) -> AsyncIterator[dict]:
    """执行已确认的计划（用户确认后调用）。"""
    mcp_client = state.get("mcp_client")
    logger.info("agent_confirmed_execute", plan_len=len(state.get("plan", [])))
    
    print("sssstate", state)

    exec_result = await run_executor(state, mcp_client)
    state = {**state, **exec_result}

    syn_result = synthesizer_node(state)
    final_reply = syn_result.get("final_reply", "")

    for chunk in _stream_text(final_reply):
        yield chunk

    yield sse_event("done", {"type": "done", "session_id": "", "message": final_reply})


# ─────────────────────────────────────────────────────────────────────────────
# API 路由
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    api_key: str = Depends(verify_api_key),
):
    """
    流式对话 API。

    - confirm=false（默认）：LangGraph Agent 全自动执行，流式返回结果
    - confirm=true：两阶段流程，先返回确认信息，前端再调用 /chat/confirm
    """

    async def event_generator() -> AsyncIterator[dict]:
        session_id = request.session_id or str(uuid.uuid4())
        user_message = request.message

        logger.info("chat_request", session_id=session_id, confirm=request.confirm,
                    message=user_message)

        mcp_client = runtime_state.agent_mcp_client.get_()
        compiled_graph = runtime_state.agent_graph.get_()

        if mcp_client is None or compiled_graph is None:
            logger.error("agent_not_ready")
            yield sse_event("error", {
                "type": "error",
                "code": "AGENT_NOT_READY",
                "message": "Agent 未就绪，请稍后重试",
            })
            return

        if request.confirm:
            # ── 两阶段：提取计划 ────────────────────────────────────────
            state = _build_initial_state(user_message, mcp_client)
            from app.tracing import get_tracer_config
            tracer_config = get_tracer_config(metadata={"session_id": session_id})
            graph_result = compiled_graph.invoke(state, config=tracer_config)
            state = dict(graph_result)

            intent = state.get("intent", "chat")
            needs_confirm = state.get("needs_confirmation", False)

            if needs_confirm and state.get("plan"):
                # 保存状态，等待 /chat/confirm
                _pending_sessions[session_id] = state
                plan_steps = [
                    PlanStep(
                        step=s["step"],
                        action=s["action"],
                        tool=s.get("tool"),
                        args=s.get("args"),
                    )
                    for s in state.get("plan", [])
                ]
                yield sse_event("confirm", ConfirmRequired(
                    type="confirm_required",
                    intent=intent,
                    summary=state.get("intent_reason", ""),
                    steps=plan_steps,
                    session_id=session_id,
                ).model_dump())
                logger.info("confirm_required", session_id=session_id)
                return

            # 无需确认，直接执行
            async for event in agent_run_confirmed(state):
                yield event
            return

        # ── 直接执行模式 ──────────────────────────────────────────────
        async for event in agent_run(
            user_input=user_message,
            mcp_client=mcp_client,
            compiled_graph=compiled_graph,
            session_id=session_id,
        ):
            yield event

    return EventSourceResponse(event_generator())


@router.post("/chat/confirm")
async def chat_confirm(
    session_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    两阶段确认流程第二步：用户确认后，继续执行计划。
    """
    if session_id not in _pending_sessions:
        return EventSourceResponse(iter([
            sse_event("error", {
                "type": "error",
                "code": "SESSION_NOT_FOUND",
                "message": "未找到对应的会话计划，请先调用 /v1/chat/stream",
            })
        ]))

    pending_state = _pending_sessions.pop(session_id)
    logger.info("chat_confirmed", session_id=session_id)

    async def event_generator() -> AsyncIterator[dict]:
        try:
            async for event in agent_run_confirmed(pending_state):
                yield event
        except Exception as exc:
            logger.error("confirm_execution_error", error=str(exc), exc_info=True)
            yield sse_event("error", {
                "type": "error",
                "code": "EXECUTION_ERROR",
                "message": str(exc),
            })

    return EventSourceResponse(event_generator())
