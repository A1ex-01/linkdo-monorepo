"""
应用全局运行时状态。

用于在模块间共享 agent 实例，打破循环导入：
  main.py  (lifespan)  → set_()
  chat.py              → get_()

使用 class 而不是 global 变量，避免 import 时序问题。
"""

from __future__ import annotations

from typing import Any


class RuntimeState:
    """可写的运行时状态容器。"""

    __slots__ = ("_value",)

    def __init__(self) -> None:
        self._value: Any = None

    def set_(self, value: Any) -> None:
        self._value = value

    def get_(self) -> Any:
        return self._value

    def __repr__(self) -> str:
        v = self._value
        if v is None:
            return "RuntimeState(None)"
        return f"RuntimeState({type(v).__name__})"


# 模块级实例
agent_mcp_client = RuntimeState()  # MCPClient 单例
agent_graph = RuntimeState()       # compiled LangGraph
