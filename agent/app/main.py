"""
FastAPI 应用入口。
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent.client import get_mcp_client as get_mcp
from app.agent.graph import build_graph
from app.api.routes import chat
from app.config import settings
from app.mcp.manager import MCPConnectionManager, set_mcp_manager
import app.runtime_state as runtime_state
from app.utils.logger import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """应用生命周期：启动时连接 MCP，构建 LangGraph，关闭时断开。"""
    logger.info("app_starting", api_key_set=bool(settings.api_key))

    mcp_manager = MCPConnectionManager(
        base_url=settings.mcp.base_url,
        token=settings.mcp.token,
        timeout=settings.mcp.timeout,
    )
    set_mcp_manager(mcp_manager)

    try:
        await mcp_manager.start()
        logger.info("mcp_connected", base_url=settings.mcp.base_url)

        # 初始化 LangGraph Agent 并写入 runtime_state
        mcp_client = await get_mcp(mcp_manager)
        compiled_graph = build_graph(mcp_client)
        runtime_state.agent_mcp_client.set_(mcp_client)
        runtime_state.agent_graph.set_(compiled_graph)
        logger.info("agent_graph_ready")

    except Exception as exc:
        logger.warning("agent_init_failed", error=str(exc))

    yield

    logger.info("app_shutting_down")
    try:
        await mcp_manager.stop()
    except Exception as exc:
        logger.warning("mcp_stop_error", error=str(exc))


def create_app() -> FastAPI:
    app = FastAPI(
        title="Link-Do Agent API",
        description="流式对话 API，支持两阶段确认",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(chat.router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "app": settings.app_name}

    return app


app = create_app()


def run() -> None:
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.server.reload,
        log_level=settings.server.log_level,
    )


if __name__ == "__main__":
    run()
