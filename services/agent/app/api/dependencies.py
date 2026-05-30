"""
API Key 认证依赖。
"""

from __future__ import annotations

from fastapi import Header, HTTPException, status

from app.config import settings


async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    """
    验证请求头中的 API Key。
    - 从 X-API-Key header 读取
    - 与配置的 AGENT_API_KEY 比对
    - 通过则返回 API Key 本身（可用于审计）
    - 失败则 401
    """
    configured = settings.api_key
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent API Key 未配置（AGENT_API_KEY 环境变量）",
        )

    if x_api_key != configured:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的 API Key",
        )

    return x_api_key
