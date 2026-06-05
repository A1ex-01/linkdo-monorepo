"""
Agent FastAPI 服务配置。
使用 pydantic-settings 从环境变量加载。
"""

from __future__ import annotations

import os
from pathlib import Path

# 最简单的 .env 加载：直接读文件设置 os.environ
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_api_key() -> str:
    """从多个可能的环境变量名中解析 API Key。"""
    return os.getenv("LLM_API_KEY") or os.getenv("DEEPSEEK_API_KEY") or ""


class LLMConfig(BaseSettings):
    """LLM（大语言模型）配置。"""

    base_url: str = "https://api.deepseek.com"
    model: str = "deepseek-chat"
    temperature: float = 0.7
    max_tokens: int = 8192
    timeout: int = 120

    @property
    def api_key(self) -> str:
        return _resolve_api_key()

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    model_config = SettingsConfigDict(env_prefix="LLM_")


class MCPConfig(BaseSettings):
    """MCP Server 配置（HTTP 远程服务）。"""

    base_url: str = "http://127.0.0.1:3456"
    token: str = ""
    timeout: int = 30

    @property
    def headers(self) -> dict[str, str]:
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    model_config = SettingsConfigDict(env_prefix="MCP_")


class ServerConfig(BaseSettings):
    """Uvicorn 服务配置。"""

    host: str = "127.0.0.1"
    port: int = 6001
    reload: bool = False
    log_level: str = "info"

    model_config = SettingsConfigDict(env_prefix="SERVER_")


class LangSmithConfig(BaseSettings):
    """LangSmith 可观测性配置。"""

    enabled: bool = False
    api_key: str = ""
    project: str = "link-do-agent"
    endpoint: str = "https://api.smith.langchain.com"

    @property
    def is_configured(self) -> bool:
        return self.enabled and bool(self.api_key)

    model_config = SettingsConfigDict(env_prefix="LANGSMITH_")


class AgentServerSettings(BaseSettings):
    """Agent FastAPI 服务全局配置。"""

    app_name: str = "Link-Do Agent"
    api_key: str = os.getenv("AGENT_API_KEY", "")
    debug: bool = False

    llm: LLMConfig = LLMConfig()
    mcp: MCPConfig = MCPConfig()
    server: ServerConfig = ServerConfig()
    langsmith: LangSmithConfig = LangSmithConfig()


settings = AgentServerSettings()
