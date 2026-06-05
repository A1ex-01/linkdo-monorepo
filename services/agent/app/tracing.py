"""
LangSmith 可观测性集成。

提供：
- `tracer` — LangChainTracer 实例（可传入 graph.compile().with_config()）
- `@traceable` — 装饰器，自动追踪 LLM 调用和工具执行
- `get_tracer_config()` — 返回 callbacks=[tracer] 配置字典
- `is_tracing_enabled()` — 当前是否启用追踪

使用方式：
  # 1. 环境变量（最简）
  LANGSMITH_TRACING=true LANGSMITH_API_KEY=ls_... python -m app.main

  # 2. 在 graph.invoke() 时注入 tracer
  graph.invoke(state, config=get_tracer_config())

  # 3. 在 MCP 工具调用处用 @traceable(run_type="tool")
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.config import settings

if TYPE_CHECKING:
    from langchain_core.tracers import LangChainTracer


_tracer: "LangChainTracer | None" = None
_traced_llm: Any = None  # wrapped LLM


def is_tracing_enabled() -> bool:
    """当前是否已启用 LangSmith 追踪。"""
    return settings.langsmith.is_configured


def _build_tracer() -> "LangChainTracer | None":
    """按需构造 LangChainTracer（惰性单例）。"""
    global _tracer
    if _tracer is not None:
        return _tracer

    if not settings.langsmith.is_configured:
        return None

    from langchain_core.tracers.langchain import LangChainTracer

    _tracer = LangChainTracer(
        project_name=settings.langsmith.project,
        client=None,  # 自动读取 LANGSMITH_* 环境变量
    )
    return _tracer


def get_tracer() -> "LangChainTracer | None":
    """获取 LangChainTracer 实例（未配置时返回 None）。"""
    return _build_tracer()


def get_tracer_config(
    metadata: dict[str, Any] | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    """
    返回可传入 graph.invoke(state, config=...) 的 callbacks 配置。

    使用示例：
        graph.invoke(state, config=get_tracer_config(
            metadata={"session_id": session_id},
            tags=["chat", "production"],
        ))
    """
    tracer = _build_tracer()
    if tracer is None:
        return {}

    config: dict[str, Any] = {"callbacks": [tracer]}
    if metadata:
        config["metadata"] = metadata
    if tags:
        config["tags"] = tags
    return config


def traced_llm() -> Any:
    """
    返回已包装了 langsmith wrapper 的 LLM 实例。
    自动注入 langsmith tracing wrapper，使每个 LLM 调用作为嵌套 span 记录。

    使用示例：
        from langchain_deepseek import ChatDeepSeek
        base_llm = ChatDeepSeek(...)
        traced = traced_llm(base_llm)
        traced.invoke([...])  # 自动记录到 LangSmith
    """
    global _traced_llm
    if _traced_llm is not None:
        return _traced_llm

    from langchain_deepseek import ChatDeepSeek
    from langsmith import traceable
    from langsmith.wrappers import wrap_openai

    # 1. wrap_openai 包装底层 HTTP 客户端，使每个 LLM 调用自动记录为嵌套 span
    _traced_llm = wrap_openai(ChatDeepSeek(
        model=settings.llm.model,
        api_key=settings.llm.api_key,
        api_base=settings.llm.base_url,
        temperature=settings.llm.temperature,
    ))
    return _traced_llm
