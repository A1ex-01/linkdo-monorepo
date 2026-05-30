"""
结构化日志工具。
使用 structlog 提供统一日志格式。
"""

from __future__ import annotations

import logging
import os
import sys

import structlog


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    获取一个结构化日志记录器。
    所有 app.* 模块统一使用此函数创建 logger。
    """
    return structlog.get_logger(name)


def configure_logging() -> None:
    """配置全局日志格式（应用启动时调用一次）。"""
    level_str = os.getenv("SERVER_LOG_LEVEL", "info")
    level = getattr(logging, level_str.upper(), logging.INFO)

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    try:
        import orjson
        serializer = orjson.dumps
    except ImportError:
        import json
        serializer = json.dumps

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(serializer=serializer),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
