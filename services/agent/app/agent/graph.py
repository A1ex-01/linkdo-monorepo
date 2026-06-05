"""
LangGraph 编译 — 对标 base.py 的 build_graph()。

图结构（LangGraph v2）：
┌─────────────────────────────────────────────────────────────────┐
│  classifier → 意图分类（规则引擎优先 + LLM 兜底）                 │
│       │                                                          │
│       ├── intent=chat  → chat_fallback → END                    │
│       │                                                          │
│       └── intent≠chat → planner → confirm                        │
│                              │                                   │
│       ┌──────────────────────┤                                   │
│       │ needs_confirm        │ skip_confirm                    │
│       ▼                      ▼                                  │
│  [外部接管]              [外部接管]                               │
│       │                      │                                  │
│       └──────────┬───────────┘                                  │
│                  ▼                                              │
│           run_executor() ← async 执行器（外部 await）             │
│                  │                                              │
│                  ▼                                              │
│             synthesizer → END                                   │
└─────────────────────────────────────────────────────────────────┘

注意：executor 是 async 函数，不作为 LangGraph 节点，
而是由外部（chat.py）await 后再进入 synthesizer。
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, TypedDict

from langgraph.graph import StateGraph, END

from app.agent.client import MCPClient
from app.agent.nodes import (
    confirm_node,
    intent_classifier,
    planner_node,
    route_after_classifier,
    route_after_confirm,
    synthesizer_node,
)

if TYPE_CHECKING:
    pass


# ─────────────────────────────────────────────────────────────────────────────
# AgentState TypedDict（与 base.py 一致）
# ─────────────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    """LangGraph 全局状态类型。"""
    messages: list
    original_input: str
    intent: str
    intent_confidence: str
    intent_reason: str
    plan: list[dict]
    current_step: int
    step_results: list[dict]
    needs_confirmation: bool
    confirmation_message: str
    final_reply: str
    # 运行时注入（不参与图序列化）
    mcp_client: MCPClient | None


# ─────────────────────────────────────────────────────────────────────────────
# 编译图
# ─────────────────────────────────────────────────────────────────────────────

def build_graph(mcp_client: MCPClient) -> Any:
    """
    编译 LangGraph v2 状态图。

    参数:
        mcp_client: MCP 客户端实例（用于节点内访问工具 schema）
    """

    def classifier_w(state: dict) -> dict:
        return intent_classifier(state, mcp_client)

    graph = StateGraph(AgentState)

    # ── 节点 ──────────────────────────────────────────────────────────────
    graph.add_node("classifier", classifier_w)
    graph.add_node("planner", lambda s: planner_node(s, mcp_client))
    graph.add_node("confirm", confirm_node)
    # chat_fallback：复用 synthesizer（chat 模式直接生成回复）
    graph.add_node("chat_fallback", synthesizer_node)
    # skip_confirm / needs_confirm：空节点，外部接管
    graph.add_node("skip_confirm", lambda s: s)
    graph.add_node("needs_confirm", lambda s: s)

    # ── 入口 ─────────────────────────────────────────────────────────────
    graph.set_entry_point("classifier")

    # ── classifier 路由 ───────────────────────────────────────────────────
    graph.add_conditional_edges(
        "classifier",
        route_after_classifier,
        {
            "chat_fallback": "chat_fallback",
            "planner": "planner",
        },
    )
    graph.add_edge("chat_fallback", END)

    # ── planner → confirm ─────────────────────────────────────────────────
    graph.add_edge("planner", "confirm")

    # ── confirm 路由 ─────────────────────────────────────────────────────
    graph.add_conditional_edges(
        "confirm",
        route_after_confirm,
        {
            "needs_confirm": "needs_confirm",
            "skip_confirm": "skip_confirm",
        },
    )

    # ── 确认节点 → END（外部主循环接管后续流程） ──────────────────────────
    graph.add_edge("needs_confirm", END)
    graph.add_edge("skip_confirm", END)

    compiled = graph.compile()

    # ── LangSmith 追踪注入 ───────────────────────────────────────────────
    from app.tracing import get_tracer
    tracer = get_tracer()
    if tracer is not None:
        compiled = compiled.with_config(callbacks=[tracer])

    return compiled


__all__ = ["AgentState", "build_graph"]
