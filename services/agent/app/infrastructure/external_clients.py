"""
外部 HTTP API 客户端。
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings


class OpenAIClient:
    """OpenAI / DeepSeek 兼容 API 客户端（聊天补全）。"""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        self._api_key = api_key or settings.llm.api_key
        self._base_url = (base_url or settings.llm.base_url).rstrip("/")
        self._model = model or settings.llm.model
        self._timeout = settings.llm.timeout

    async def chat(
        self,
        messages: list[dict[str, str]],
        stream: bool = False,
        temperature: float | None = None,
        max_tokens: int | None = None,
        tools: list[dict] | None = None,
        **kwargs,
    ) -> httpx.Response:
        body: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "stream": stream,
            "temperature": temperature if temperature is not None else settings.llm.temperature,
            "max_tokens": max_tokens or settings.llm.max_tokens,
        }
        if tools:
            body["tools"] = tools
        body.update(kwargs)

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                f"{self._base_url}/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            return resp

    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        **kwargs,
    ):
        """
        发送聊天补全请求（流式）。
        返回异步生成器，逐个 yield SSE 解析后的 JSON 行。
        """
        body: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "stream": True,
            "temperature": kwargs.pop("temperature", settings.llm.temperature),
            "max_tokens": kwargs.pop("max_tokens", settings.llm.max_tokens),
            **kwargs,
        }

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(self._timeout, read=None)
        ) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    line = line.rstrip("\n")
                    if line.startswith("data: "):
                        data = line[6:]
                    else:
                        data = line
                    if data == "[DONE]":
                        break
                    yield data
