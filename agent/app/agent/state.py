"""
Agent State 类型定义 — 与 base.py 的 AgentState TypedDict 完全一致。

实际类型在 graph.py 中定义（避免循环导入）。
本模块作为公共导出入口。
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.agent.graph import AgentState

__all__ = ["AgentState"]
