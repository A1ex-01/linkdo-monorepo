"""
请求日志中间件。
注入 request_id 和 user_id 到 structlog context，并记录请求生命周期。
"""

from __future__ import annotations

import base64
import json
import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.utils.logger import get_logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """中间件：在每个请求中注入日志上下文并记录生命周期。"""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Response],
    ) -> Response:
        request_id = str(uuid.uuid4())
        user_id = _extract_user_id(request)

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            user_id=user_id,
        )

        log = get_logger("app.http")
        log.info("request_started", method=request.method, path=request.url.path)

        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        log.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        response.headers["X-Request-ID"] = request_id
        return response


def _extract_user_id(request: Request) -> str:
    """
    从 Authorization header 中提取 JWT 的 sub claim。
    若解析失败或无 token，返回 'anonymous'。
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return "anonymous"

    token = auth_header[7:]
    try:
        payload_b64 = token.split(".")[1]
        # 补全 base64 padding
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload.get("sub", "anonymous")
    except Exception:
        return "anonymous"
