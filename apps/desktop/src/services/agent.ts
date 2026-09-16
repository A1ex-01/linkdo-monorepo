/**
 * Versioned Linkdo agent protocol.
 *
 * The chat UI is deliberately isolated from LangGraph node names and internal
 * checkpoint ids. HTTP inputs and SSE outputs are correlated by a public
 * conversation id, a client request id, and (for mutations) an operation id.
 */

import { AGENT_URL } from "@/config";
import { getToken } from "./client-request";

export type AgentAction =
  | "intent-classify"
  | "get_tasks"
  | "create_task"
  | "update_task"
  | "delete_task"
  | "chitchat"
  | "send_message";

export type AgentEventType =
  | "run_started"
  | "action_started"
  | "assistant_message"
  | "approval_required"
  | "action_completed"
  | "error"
  | "run_completed";

export interface AgentEvent {
  v: 1;
  type: AgentEventType;
  conversationId: string;
  requestId: string;
  operationId?: string;
  action?: AgentAction;
  payload: Record<string, unknown>;
}

export interface SSEUnknownEvent {
  type: "unknown";
  raw: string;
}

export type SSEEvent = AgentEvent | SSEUnknownEvent;

export interface AgentMessageRequest {
  conversation_id: string;
  request_id: string;
  context: { active_collection_id?: string };
  input: { message: string };
}

export interface AgentConfirmationRequest {
  conversation_id: string;
  operation_id: string;
  decision: "approve" | "deny";
}

export interface SendMessageOptions {
  conversationId: string;
  requestId: string;
  message: string;
  activeCollectionId?: string;
  onEvent?: (event: SSEEvent) => void;
  onError?: (code: string, message: string) => void;
}

export interface ConfirmOptions {
  conversationId: string;
  operationId: string;
  decision: "approve" | "deny";
  onEvent?: (event: SSEEvent) => void;
  onError?: (code: string, message: string) => void;
}

const EVENT_TYPES = new Set<AgentEventType>([
  "run_started",
  "action_started",
  "assistant_message",
  "approval_required",
  "action_completed",
  "error",
  "run_completed",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * A completed mutation can represent an explicit HITL denial. Keep this
 * distinction in the shared protocol layer so every presentation surface
 * avoids treating a cancelled plan as a successful write.
 */
export function isCancelledMutation(payload: Record<string, unknown>): boolean {
  return payload.approved === false;
}

export function buildAgentMessageRequest(
  input: Omit<SendMessageOptions, "onEvent" | "onError">,
): AgentMessageRequest {
  const context = input.activeCollectionId
    ? { active_collection_id: input.activeCollectionId }
    : {};
  return {
    conversation_id: input.conversationId,
    request_id: input.requestId,
    context,
    input: { message: input.message },
  };
}

export function buildAgentConfirmationRequest(
  input: Pick<ConfirmOptions, "conversationId" | "operationId" | "decision">,
): AgentConfirmationRequest {
  return {
    conversation_id: input.conversationId,
    operation_id: input.operationId,
    decision: input.decision,
  };
}

export function parseAgentEvent(raw: string): SSEEvent {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { type: "unknown", raw };
  }

  const type = parsed.type;
  const conversationId = asOptionalString(parsed.conversation_id);
  const requestId = asOptionalString(parsed.request_id);
  if (
    parsed.v !== 1 ||
    typeof type !== "string" ||
    !EVENT_TYPES.has(type as AgentEventType) ||
    !conversationId ||
    !requestId
  ) {
    return { type: "unknown", raw };
  }

  return {
    v: 1,
    type: type as AgentEventType,
    conversationId,
    requestId,
    operationId: asOptionalString(parsed.operation_id),
    action: asOptionalString(parsed.action) as AgentAction | undefined,
    payload: asRecord(parsed.payload),
  };
}

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
  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    handlers.onEvent?.(parseAgentEvent(trimmed.slice(5).trim()));
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) consumeLine(line);
    }
    buffer += decoder.decode();
    if (buffer) consumeLine(buffer);
  } finally {
    reader.releaseLock();
  }
}

export async function sendAgentMessage(
  options: SendMessageOptions,
): Promise<void> {
  const token = getToken();
  const response = await fetch(`${AGENT_URL}/api/chat/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(buildAgentMessageRequest(options)),
  });
  await readSSEStream(response, options);
}

export async function confirmAgentPlan(options: ConfirmOptions): Promise<void> {
  const token = getToken();
  const response = await fetch(`${AGENT_URL}/api/chat/confirm-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(buildAgentConfirmationRequest(options)),
  });
  await readSSEStream(response, options);
}
