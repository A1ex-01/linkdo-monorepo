/**
 * Agent SSE Streaming API Service
 * Endpoint: POST http://localhost:6001/v1/chat/stream
 */

import { AGENT_URL, AGENT_API_KEY } from "@/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlanStep {
  step: number;
  action: string;
  tool: string | null;
  args: Record<string, unknown> | null;
}

export type SSEEvent =
  | { type: "confirm_required"; intent: string; summary: string; steps: PlanStep[]; session_id: string }
  | { type: "execute_start"; session_id: string }
  | { type: "text"; content: string }
  | { type: "done"; session_id: string; message: string }
  | { type: "error"; code: string; message: string }
  | { type: "unknown"; raw: string };

export interface SendMessageOptions {
  message: string;
  sessionId?: string;
  confirm?: boolean;
  onEvent?: (event: SSEEvent) => void;
  onConfirmRequired?: (intent: string, summary: string, steps: PlanStep[], sessionId: string) => void;
  onExecuteStart?: (sessionId: string) => void;
  onText?: (content: string) => void;
  onDone?: (message: string) => void;
  onError?: (code: string, message: string) => void;
}

export interface ConfirmOptions {
  sessionId: string;
  onEvent?: (event: SSEEvent) => void;
  onExecuteStart?: (sessionId: string) => void;
  onText?: (content: string) => void;
  onDone?: (message: string) => void;
  onError?: (code: string, message: string) => void;
}

// ---------------------------------------------------------------------------
// Internal SSE parser (handles both text and EventSource format)
// ---------------------------------------------------------------------------

function parseSSEEvent(data: string): SSEEvent {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    const { type, ...rest } = parsed;

    switch (type) {
      case "confirm_required":
        return { type: "confirm_required", ...(parsed as { intent: string; summary: string; steps: PlanStep[]; session_id: string }) };
      case "execute_start":
        return { type: "execute_start", session_id: (parsed as { session_id: string }).session_id };
      case "text":
        return { type: "text", content: (parsed as { content: string }).content };
      case "done":
        return { type: "done", session_id: (parsed as { session_id: string }).session_id, message: (parsed as { message: string }).message };
      case "error":
        return { type: "error", code: (parsed as { code: string }).code, message: (parsed as { message: string }).message };
      default:
        return { type: "unknown", raw: data };
    }
  } catch {
    return { type: "unknown", raw: data };
  }
}

// ---------------------------------------------------------------------------
// Streaming fetch with SSE parsing
// ---------------------------------------------------------------------------

export async function sendAgentMessage(options: SendMessageOptions): Promise<void> {
  const {
    message,
    sessionId,
    confirm = false,
    onEvent,
    onConfirmRequired,
    onExecuteStart,
    onText,
    onDone,
    onError,
  } = options;

  const body: Record<string, unknown> = { message, confirm };
  if (sessionId) body.session_id = sessionId;

  const response = await fetch(`${AGENT_URL}/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": AGENT_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    onError?.("HTTP_ERROR", `请求失败: ${response.status} ${response.statusText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError?.("NO_STREAM", "无法读取响应流");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines (SSE format: "data: {...}\n\n")
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (!data) continue;

        const event = parseSSEEvent(data);
        onEvent?.(event);

        switch (event.type) {
          case "confirm_required":
            onConfirmRequired?.(event.intent, event.summary, event.steps, event.session_id);
            break;
          case "execute_start":
            onExecuteStart?.(event.session_id);
            break;
          case "text":
            onText?.(event.content);
            break;
          case "done":
            onDone?.(event.message);
            break;
          case "error":
            onError?.(event.code, event.message);
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function confirmAgentPlan(options: ConfirmOptions): Promise<void> {
  const { sessionId, onEvent, onExecuteStart, onText, onDone, onError } = options;

  const response = await fetch(`${AGENT_URL}/v1/chat/confirm?session_id=${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: {
      "X-API-Key": AGENT_API_KEY,
    },
  });

  if (!response.ok) {
    onError?.("HTTP_ERROR", `请求失败: ${response.status} ${response.statusText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError?.("NO_STREAM", "无法读取响应流");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (!data) continue;

        const event = parseSSEEvent(data);
        onEvent?.(event);

        switch (event.type) {
          case "execute_start":
            onExecuteStart?.(event.session_id);
            break;
          case "text":
            onText?.(event.content);
            break;
          case "done":
            onDone?.(event.message);
            break;
          case "error":
            onError?.(event.code, event.message);
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
