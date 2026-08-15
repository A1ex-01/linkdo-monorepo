/**
 * Agent SSE Streaming API Service.
 *
 * Backend endpoints (a-link-do a-agent, FastAPI):
 *   POST /api/chat/send-message   body: { message, session_id? }
 *   POST /api/chat/confirm-message body: { thread_id, approved, edits? }
 *
 * Both endpoints stream `text/event-stream`. Each frame is a single JSON
 * object keyed by `type`. The schema mirrors `services/a-agent/agent/single/graph.py`:
 *
 *   { "type": "start", "name": "<node>", "data": { ... } }
 *   { "type": "end",   "name": "<node>", "data": { ... } }
 *   { "type": "confirm_required", "name": "<node>",
 *     "data": { session_id, intent, summary, preview, params } }
 *   { "type": "error",  "name": "<node>", "data": { code, message } }
 *   { "type": "done",   "data": { message, session_id } }
 *   { "type": "text",   "data": { content } }
 *
 * This module is intentionally thin: it only parses the SSE stream into
 * raw JSON frames. No domain-specific shape inference happens here — that's
 * the consumer's responsibility, so adding a new field on the backend never
 * requires touching this file.
 */

import { AGENT_URL } from "@/config";
import { getToken } from "./client-request";

// ---------------------------------------------------------------------------
// Raw event types (one-to-one with the SSE payload).
// ---------------------------------------------------------------------------

export interface SSEEventBase {
  /** Raw type field as sent by the server. */
  type: string;
  /** Node name where applicable (`start` / `end` / `confirm_required` / `error`). */
  name?: string;
  /** Free-form data payload. Always a record (never a scalar). */
  data: Record<string, unknown>;
}

export interface SSETextEvent extends SSEEventBase {
  type: "text";
  /** Convenience: `data.content` unwrapped. */
  content: string;
}

export interface SSEDoneEvent extends SSEEventBase {
  type: "done";
}

export interface SSEUnknownEvent {
  type: "unknown";
  /** The raw `data:` line that failed to parse. */
  raw: string;
}

export type SSEEvent =
  | SSEEventBase
  | SSETextEvent
  | SSEDoneEvent
  | SSEUnknownEvent;

// ---------------------------------------------------------------------------
// Public options
// ---------------------------------------------------------------------------

export interface SendMessageOptions {
  message: string;
  sessionId?: string;
  onEvent?: (event: SSEEvent) => void;
  onError?: (code: string, message: string) => void;
}

export interface ConfirmOptions {
  sessionId: string;
  approved: boolean;
  edits?: Record<string, unknown>;
  onEvent?: (event: SSEEvent) => void;
  onError?: (code: string, message: string) => void;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function parseSSEEvent(data: string): SSEEvent {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return { type: "unknown", raw: data };
  }

  const type = typeof parsed.type === "string" ? parsed.type : "";
  const name = typeof parsed.name === "string" ? parsed.name : undefined;
  const dataField = asRecord(parsed.data);

  switch (type) {
    case "text":
      return {
        type: "text",
        name,
        data: dataField,
        content: typeof dataField.content === "string" ? dataField.content : "",
      };
    case "done":
      return { type: "done", name, data: dataField };
    default:
      // `start`, `end`, `confirm_required`, `error`, and any future types
      // pass through unchanged. Callers decide how to render them.
      return { type, name, data: dataField };
  }
}

// ---------------------------------------------------------------------------
// SSE stream reader
// ---------------------------------------------------------------------------

async function readSSEStream(
  response: Response,
  handlers: {
    onEvent?: (event: SSEEvent) => void;
    onError?: (code: string, message: string) => void;
  },
): Promise<void> {
  if (!response.ok) {
    handlers.onError?.(
      "HTTP_ERROR",
      `请求失败: ${response.status} ${response.statusText}`,
    );
    return;
  }
  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError?.("NO_STREAM", "无法读取响应流");
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

        handlers.onEvent?.(parseSSEEvent(data));
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendAgentMessage(
  options: SendMessageOptions,
): Promise<void> {
  const { message, sessionId } = options;

  const body: Record<string, unknown> = { message };
  if (sessionId) body.session_id = sessionId;

  const token = getToken();
  const response = await fetch(`${AGENT_URL}/api/chat/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });

  await readSSEStream(response, {
    onEvent: options.onEvent,
    onError: options.onError,
  });
}

export async function confirmAgentPlan(options: ConfirmOptions): Promise<void> {
  const { sessionId, approved, edits } = options;
  const token = getToken();

  const response = await fetch(`${AGENT_URL}/api/chat/confirm-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      thread_id: sessionId,
      approved,
      edits: edits ?? {},
    }),
  });

  await readSSEStream(response, {
    onEvent: options.onEvent,
    onError: options.onError,
  });
}
