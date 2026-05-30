"""
MCP 连接管理器。
通过 HTTP 调用远程 MCP Server（SSE 响应格式）。
进程内所有请求共享同一个 HTTP 客户端连接。
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

import httpx

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MCPConnectionManager:
    """
    MCP HTTP 客户端（StreamableHTTP 协议）。

    远程 MCP Server 实现 JSON-RPC 2.0 over SSE：
    - POST /mcp → 发送 JSON-RPC 请求，响应为 SSE 事件流
    - 响应格式: event: message\\ndata: {"jsonrpc":"2.0","id":...,"result":...}

    支持 session 模式（服务器返回 MCP-SESSION-ID，后续请求带上该 header）。
    """

    def __init__(
        self,
        base_url: str | None = None,
        token: str | None = None,
        timeout: int = 30,
    ):
        self._base_url = (base_url or settings.mcp.base_url).rstrip("/")
        self._token = token or settings.mcp.token
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None
        self._started = False
        self._lock = asyncio.Lock()
        self._next_id = 1
        self._session_id: str | None = None  # ← 新增 session 支持

    def _default_headers(self) -> dict[str, str]:
        h = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self._token:
            h["Authorization"] = f"Bearer {self._token}"
        if self._session_id:
            h["MCP-SESSION-ID"] = self._session_id
        return h

    async def start(self) -> None:
        """启动：初始化 HTTP 客户端，发送 initialize。"""
        if self._started:
            return

        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._default_headers(),
            timeout=httpx.Timeout(self._timeout, read=None),
        )

        try:
            result = await self._rpc("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {"roots": {"listChanged": True}, "sampling": {}},
                "clientInfo": {"name": "linkdo-agent", "version": "0.1.0"},
            })
            logger.info("mcp_initialized", server=result.get("serverInfo", {}).get("name"))

            # 发送 notifications/initialized（MCP 握手必要步骤）
            try:
                await self._notify("notifications/initialized", {})
            except Exception as exc:
                logger.warning("notifications_initialized_failed", error=str(exc))

            # 握手完成后才标记为已启动
            self._started = True
            logger.info("mcp_connected", base_url=self._base_url, session_id=self._session_id[:20] + "..." if self._session_id else "none")
        except Exception:
            await self._client.aclose()
            self._client = None
            raise

    async def stop(self) -> None:
        """关闭 HTTP 客户端。"""
        self._started = False
        if self._client:
            await self._client.aclose()
            self._client = None

    async def list_tools(self) -> list[dict[str, Any]]:
        """列出 MCP Server 支持的工具。"""
        result = await self._rpc("tools/list", {})
        return result.get("tools", [])

    async def call_tool(
        self, name: str, arguments: dict[str, Any]
    ) -> dict[str, Any]:
        """调用 MCP 工具。"""
        return await self._rpc("tools/call", {
            "name": name,
            "arguments": arguments,
        })

    async def _rpc(
        self,
        method: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """发送 JSON-RPC 2.0 请求，等待 SSE 响应。"""
        if not self._client:
            raise RuntimeError("MCP client not started")

        async with self._lock:
            msg_id = self._next_id
            self._next_id += 1

        payload = {
            "jsonrpc": "2.0",
            "id": msg_id,
            "method": method,
            "params": params or {},
        }

        try:
            resp = await self._client.post(
                "/mcp",
                json=payload,
                headers=self._default_headers(),
            )
            resp.raise_for_status()

            # 提取并缓存 session ID（initialize 响应会返回）
            if self._session_id is None:
                session = (
                    resp.headers.get("mcp-session-id")
                    or resp.headers.get("MCP-SESSION-ID")
                    or resp.headers.get("X-MCP-Session-ID")
                )
                if session:
                    self._session_id = session
                    logger.info("mcp_session_id", session_id=session[:20] + "...")

            # 解析 SSE 响应体
            result = await self._parse_sse_response(resp.text, msg_id)
            return result

        except httpx.HTTPStatusError as exc:
            logger.error("mcp_http_error", status=exc.response.status_code, body=exc.response.text[:200])
            raise
        except httpx.RequestError as exc:
            logger.error("mcp_connection_error", error=str(exc))
            raise

    async def _parse_sse_response(self, body: str, expected_id: int) -> dict[str, Any]:
        """
        解析 SSE 格式响应体。
        格式: event: message\\ndata: {"jsonrpc":"2.0","id":...,"result":...}
        """
        # 提取所有 data: {...} 行
        data_pattern = re.compile(r"^data:\s*(.+?)$", re.MULTILINE)
        for match in data_pattern.finditer(body):
            raw = match.group(1).strip()
            if raw.startswith("{"):
                try:
                    msg = json.loads(raw)
                    # 只取 id 匹配的响应
                    if isinstance(msg, dict) and msg.get("id") == expected_id:
                        if "error" in msg:
                            raise MCPError(
                                msg["error"].get("code", -1),
                                msg["error"].get("message", "Unknown error"),
                            )
                        return msg.get("result", {})
                except json.JSONDecodeError:
                    pass
        raise MCPError(-32000, f"No valid response for id {expected_id} in SSE body")

    async def _notify(
        self,
        method: str,
        params: dict[str, Any] | None = None,
    ) -> None:
        """发送 JSON-RPC 2.0 notification（fire-and-forget，不带 id）。"""
        if not self._client:
            raise RuntimeError("MCP client not started")

        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
        }

        try:
            resp = await self._client.post(
                "/mcp",
                json=payload,
                headers=self._default_headers(),
            )
            resp.raise_for_status()
        except Exception as exc:
            logger.warning("mcp_notify_error", method=method, error=str(exc))


class MCPError(Exception):
    """MCP JSON-RPC 错误。"""

    def __init__(self, code: int, message: str):
        self.code = code
        super().__init__(f"MCP error {code}: {message}")


# ─── 全局单例 ───────────────────────────────────────────────────────────────

_mcp_manager: MCPConnectionManager | None = None


def get_mcp_manager() -> MCPConnectionManager:
    if _mcp_manager is None:
        raise RuntimeError("MCP manager not initialized")
    return _mcp_manager


def set_mcp_manager(manager: MCPConnectionManager) -> None:
    global _mcp_manager  # noqa: PLW0603
    _mcp_manager = manager
