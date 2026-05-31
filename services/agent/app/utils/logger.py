"""
结构化日志工具。
使用 structlog 提供统一日志格式，支持模块级别日志控制和上下文注入。
"""

from __future__ import annotations

import logging
import os
import sys

import structlog


# 全局模块级别日志等级映射
_module_levels: dict[str, int] = {}
_root_level = logging.INFO


def _parse_module_levels() -> None:
    """
    解析 LOG_LEVEL 环境变量，格式: module:level,module2:level2
    例如: LOG_LEVEL=app.services:DEBUG,app.tools:INFO,root:INFO
    若未设置，fallback 到 SERVER_LOG_LEVEL，然后是 info。
    """
    global _module_levels, _root_level

    log_level_env = os.getenv("LOG_LEVEL", "")
    if not log_level_env:
        fallback = os.getenv("SERVER_LOG_LEVEL", "info")
        _root_level = getattr(logging, fallback.upper(), logging.INFO)
        return

    for part in log_level_env.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            module, level_str = part.rsplit(":", 1)
            module = module.strip()
            level_str = level_str.strip().upper()
        else:
            _root_level = getattr(logging, part.upper(), logging.INFO)
            continue

        level = getattr(logging, level_str.upper(), None)
        if level is None:
            continue

        if module == "root":
            _root_level = level
        else:
            _module_levels[module] = level


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    获取一个结构化日志记录器。
    所有 app.* 模块统一使用此函数创建 logger。
    """
    return structlog.get_logger(name)


def get_logger_with_context(context: dict[str, object]) -> structlog.BoundLogger:
    """
    获取一个绑定额外上下文的 logger。
    返回的 logger 会携带传入的 context dict 中的所有键值对。
    """
    return structlog.get_logger().bind(**context)


def configure_logging() -> None:
    """配置全局日志格式（应用启动时调用一次）。"""
    _parse_module_levels()

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=_root_level,
    )

    for module, level in _module_levels.items():
        logging.getLogger(module).setLevel(level)

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
