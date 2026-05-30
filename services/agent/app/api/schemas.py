"""
Chat API 的 Pydantic 请求/响应模型。
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """POST /v1/chat/stream 请求体。"""

    message: str = Field(..., min_length=1, max_length=10000, description="用户消息")
    session_id: str | None = Field(None, description="会话 ID（为空则创建新会话）")
    confirm: bool = Field(False, description="是否进入两阶段确认流程（默认 false 直接执行）")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "帮我查看今天的任务",
                    "session_id": None,
                    "confirm": True,
                }
            ]
        }
    }


class PlanStep(BaseModel):
    """Agent 执行计划中的单个步骤。"""

    step: int = Field(..., description="步骤编号（从 1 开始）")
    action: str = Field(..., description="动作描述")
    tool: str | None = Field(None, description="调用的工具（无则为 LLM 响应）")
    args: dict | None = Field(None, description="工具调用参数")


class ConfirmRequired(BaseModel):
    """两阶段确认：第一步发送给前端的计划信息。"""

    type: str = "confirm_required"
    intent: str = Field(..., description="意图识别结果（task/get_timer/create_task...）")
    summary: str = Field(..., description="对用户意图的简要总结")
    steps: list[PlanStep] = Field(..., description="执行步骤列表")
    session_id: str = Field(..., description="会话 ID")


class ExecuteStart(BaseModel):
    """两阶段确认：开始执行时发送的事件。"""

    type: str = "execute_start"
    session_id: str


class StreamText(BaseModel):
    """流式文本事件。"""

    type: str = "text"
    content: str = Field(..., description="累积的回复文本（实时更新）")


class StreamDone(BaseModel):
    """流式结束事件。"""

    type: str = "done"
    session_id: str
    message: str = Field(..., description="最终回复内容")


class StreamError(BaseModel):
    """流式错误事件。"""

    type: str = "error"
    code: str
    message: str
