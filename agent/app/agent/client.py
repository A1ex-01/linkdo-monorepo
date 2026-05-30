"""
MCP Client 封装 — 复用 app.mcp.manager.MCPConnectionManager。

MCPConnectionManager 已实现完整的 JSON-RPC 2.0 over SSE 协议。
本模块在其基础上提供 LangChain 兼容的工具接口（schema）。
"""

from __future__ import annotations

import json
import time
from typing import TYPE_CHECKING, Any

from app.mcp.manager import MCPConnectionManager
from app.utils.logger import get_logger

if TYPE_CHECKING:
    from app.mcp.manager import MCPConnectionManager

logger = get_logger(__name__)


class MCPClient:
    """
    MCP 工具客户端（适配 LangGraph Agent）。

    内部委托给 MCPConnectionManager，
    本类专注于：
    1. 工具列表 schema（用于 LLM Function Calling）
    2. 工具调用结果格式化
    """

    def __init__(self, manager: MCPConnectionManager):
        self._manager = manager
        self._tool_schemas: list[dict[str, Any]] = []
        self._discovered = False

    async def discover_tools(self) -> None:
        """发现 MCP Server 上的工具列表并缓存 schema。"""
        if self._discovered:
            return
        tools = await self._manager.list_tools()
        self._tool_schemas = [
            {
                "name": t.get("name", ""),
                "description": t.get("description", ""),
                "input_schema": t.get("inputSchema", {}),
            }
            for t in tools
        ]
        self._discovered = True
        logger.info("mcp_tools_discovered", count=len(self._tool_schemas))

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """调用 MCP 工具，返回结果文本。"""
        logger.info("mcp_tool_call", tool=tool_name, args=arguments)
        t0 = time.perf_counter()

        try:
            result = await self._manager.call_tool(tool_name, arguments)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            logger.info("mcp_tool_done", tool=tool_name, elapsed_ms=f"{elapsed_ms:.1f}ms")

            content = result.get("content", [])
            if isinstance(content, list) and content:
                result_text = content[0].get("text", str(result))
            else:
                result_text = str(result)

            logger.debug("mcp_tool_preview", preview=result_text[:200].replace("\n", " "))
            return result_text

        except Exception as e:
            err = f"[MCP 调用失败] {type(e).__name__}: {e}"
            logger.error("mcp_tool_error", tool=tool_name, error=err)
            return err

    @property
    def tool_schemas(self) -> list[dict[str, Any]]:
        """返回工具 schema 列表（用于 LLM Function Calling）。"""
        return self._tool_schemas


# ─── 全局单例 ────────────────────────────────────────────────────────────────

_mcp_client: MCPClient | None = None


async def get_mcp_client(manager: MCPConnectionManager | None = None) -> MCPClient:
    """获取 MCPClient 单例（基于已初始化的 manager）。"""
    global _mcp_client  # noqa: PLW0603
    if _mcp_client is None:
        if manager is None:
            from app.mcp.manager import get_mcp_manager
            manager = get_mcp_manager()
        _mcp_client = MCPClient(manager)
        await _mcp_client.discover_tools()
    return _mcp_client


async def close_mcp_client() -> None:
    global _mcp_client  # noqa: PLW0603
    _mcp_client = None


__all__ = ["MCPClient", "get_mcp_client", "close_mcp_client"]
