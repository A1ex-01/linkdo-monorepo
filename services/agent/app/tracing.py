"""
LangSmith 可观测性集成。

提供：
- `is_tracing_enabled()` — 当前是否启用追踪
- `chat_with_deepseek()` — DeepSeek 聊天调用，自动带 LangSmith tracing

使用方式：
  # 1. 环境变量
  LANGSMITH_TRACING=true LANGSMITH_API_KEY=ls_... python -m app.main

  # 2. LLM 调用
  from app.tracing import chat_with_deepseek
  from langchain_core.messages import HumanMessage
  response = chat_with_deepseek([HumanMessage(content="你好")])
  print(response.content)
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.config import settings

if TYPE_CHECKING:
    from langchain_core.messages import BaseMessage


# ─────────────────────────────────────────────────────────────────────────────
# OpenAI client（指向 DeepSeek）
# ─────────────────────────────────────────────────────────────────────────────

_client: Any = None


def _get_client() -> Any:
    """获取指向 DeepSeek 的 OpenAI SDK client（惰性单例）。"""
    global _client
    if _client is not None:
        return _client
    from openai import OpenAI
    _client = OpenAI(
        api_key=settings.llm.api_key,
        base_url=settings.llm.base_url,
    )
    return _client


# ─────────────────────────────────────────────────────────────────────────────
# @traceable 直接包 HTTP 调用（LangSmith 官方推荐模式）
#
# 关键原则：@traceable 必须直接包着发起 streaming HTTP 请求的函数。
# 不要在 wrapper 层装饰——否则 chunk 事件无法透传到 LangSmith。
#
# 结构：
#   _traced_raw_chat  ← @traceable 包在这里，直接调用 client.create()
#   chat_with_deepseek  ← wrapper，做 LangChain message → dict 转换
# ─────────────────────────────────────────────────────────────────────────────

# 在模块加载时就构造好，这样 @traceable 只执行一次，不重复注入
if settings.langsmith.is_configured:
    from langsmith import traceable

    model_name = settings.llm.model
    temperature = settings.llm.temperature

    @traceable(
        run_type="llm",
        name="DeepSeek Chat Completion",
        metadata={"ls_provider": "deepseek", "ls_model_name": model_name},
    )
    def _traced_raw_chat(messages: list[dict]) -> Any:
        """
        直接调用 DeepSeek API，返回 OpenAI ChatCompletionMessage 对象。
        @traceable 在此层，确保 streaming chunk 正确透传。
        """
        return _get_client().chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
        )

else:
    def _traced_raw_chat(messages: list[dict]) -> Any:
        return _get_client().chat.completions.create(
            model=settings.llm.model,
            messages=messages,
            temperature=settings.llm.temperature,
        )


def is_tracing_enabled() -> bool:
    """当前是否已启用 LangSmith 追踪。"""
    return settings.langsmith.is_configured


# ─────────────────────────────────────────────────────────────────────────────
# LangChainTracer（可选，用于非 @traceable 模式）
# 注意：当 tracing 启用时，优先使用 @traceable，LangChainTracer 返回 None。
# ─────────────────────────────────────────────────────────────────────────────

_tracer_impl: Any = None


def get_tracer() -> Any | None:
    """
    获取 LangChainTracer 实例。

    注意：当 LangSmith tracing 通过 @traceable 启用时，返回 None，
    避免与 @traceable 的独立 run 产生 ID 冲突。
    建议使用 get_tracer_config() 替代。
    """
    global _tracer_impl
    if _tracer_impl is not None:
        return _tracer_impl

    if settings.langsmith.is_configured:
        # @traceable 已覆盖追踪，不再构建 LangChainTracer
        return None

    from langchain_core.tracers.langchain import LangChainTracer

    _tracer_impl = LangChainTracer(
        project_name=settings.langsmith.project,
        client=None,
    )
    return _tracer_impl


def get_tracer_config(
    metadata: dict[str, Any] | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    """
    返回可传入 graph.invoke(state, config=...) 的 callbacks 配置。

    注意：当 LangSmith tracing 通过 @traceable 启用时，返回空 dict，
    避免与 @traceable 的独立 run 产生 ID 冲突。
    """
    tracer = get_tracer()
    if tracer is None:
        return {}

    config: dict[str, Any] = {"callbacks": [tracer]}
    if metadata:
        config["metadata"] = metadata
    if tags:
        config["tags"] = tags
    return config


def _to_openai_role(message: "BaseMessage") -> str:
    """将 LangChain message type 映射为 OpenAI role 字符串。"""
    t = type(message).__name__
    if t == "HumanMessage":
        return "user"
    if t == "AIMessage":
        return "assistant"
    if t == "SystemMessage":
        return "system"
    if t == "ToolMessage":
        return "tool"
    return "user"


def _to_dict(message: "BaseMessage") -> dict:
    """将 LangChain message 转为 OpenAI API 所需 dict 格式。"""
    return {"role": _to_openai_role(message), "content": message.content}


def chat_with_deepseek(messages: list["BaseMessage"]) -> "BaseMessage":
    """
    DeepSeek 聊天调用，带 LangSmith tracing。

    流程：LangChain message → dict → @traceable(_traced_raw_chat) → API → HumanMessage
    @traceable 直接装饰 _traced_raw_chat，确保 streaming chunk 正确透传。
    """
    from langchain_core.messages import HumanMessage

    dict_messages = [_to_dict(m) for m in messages]
    response = _traced_raw_chat(dict_messages)
    return HumanMessage(content=response.choices[0].message.content)
