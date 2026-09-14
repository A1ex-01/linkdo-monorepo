"use client";

import { useData } from "@/app/work/data-provider";
import {
  type AgentEvent,
  confirmAgentPlan,
  isCancelledMutation,
  sendAgentMessage,
  type SSEEvent,
} from "@/services/agent";
import { IconAi, IconCheck, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReasoningText } from "../agents/loading-states/reasoning-text";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageGroup,
  MessageScroller,
} from "../agents/message";
import { PromptInput } from "../agents/prompt-input";
import { ToolApproval, type ToolApprovalStatus } from "../agents/tool-approval";

// ---------------------------------------------------------------------------
// Message model — only this component maps the versioned agent event contract
// into presentation cards. No LangGraph event names or checkpoint ids leak in.
// ---------------------------------------------------------------------------

type MessageKind =
  | "user"
  | "text"
  | "intent_classify"
  | "tasks"
  | "create_task"
  | "update_task"
  | "delete_task"
  | "chitchat"
  | "confirm"
  | "error";

interface MessageBase {
  id: string;
  role: "user" | "assistant";
  /** Free-form payload from the backend (or the user's text input). */
  data: Record<string, unknown>;
}

interface StatusAwareMessage extends MessageBase {
  /** Tracks whether the node is still running or has emitted `end`. */
  status?: "running" | "done";
}

interface UserMessage extends MessageBase {
  kind: "user";
}

interface TextMessage extends MessageBase {
  kind: "text";
}

interface IntentClassifyMessage extends StatusAwareMessage {
  kind: "intent_classify";
  /** Node name (`start` of this kind is always `intent-classify`). */
  nodeName: "intent-classify";
}

interface TasksMessage extends StatusAwareMessage {
  kind: "tasks";
  nodeName: "get_tasks";
}

interface GenericNodeMessage extends StatusAwareMessage {
  kind: "create_task" | "update_task" | "delete_task" | "chitchat";
  nodeName: string;
}

interface ConfirmMessage extends MessageBase {
  kind: "confirm";
  conversationId: string;
  operationId: string;
  status: ToolApprovalStatus;
}

interface ErrorMessage extends MessageBase {
  kind: "error";
}

type AIChatMessage =
  | UserMessage
  | TextMessage
  | IntentClassifyMessage
  | TasksMessage
  | GenericNodeMessage
  | ConfirmMessage
  | ErrorMessage;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId() {
  return Math.random().toString(36).slice(2);
}

function nodeLabel(name: string): string {
  switch (name) {
    case "intent-classify":
      return "意图识别";
    case "get_tasks":
      return "加载任务列表";
    case "create_task":
      return "新建任务";
    case "update_task":
      return "更新任务";
    case "delete_task":
      return "删除任务";
    case "chitchat":
      return "闲聊回复";
    case "internet_search":
      return "联网搜索";
    default:
      return name;
  }
}

function intentLabel(intent: string): string {
  switch (intent) {
    case "create_task":
      return "新建任务";
    case "update_task":
      return "更新任务";
    case "delete_task":
      return "删除任务";
    case "get_tasks":
      return "获取任务";
    case "chitchat":
      return "闲聊";
    default:
      return intent;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "backlog":
      return "bg-slate-500/15 text-slate-200";
    case "this_week":
      return "bg-amber-500/15 text-amber-200";
    case "today":
      return "bg-emerald-500/15 text-emerald-200";
    case "done":
      return "bg-blue-500/15 text-blue-200";
    default:
      return "bg-zinc-500/15 text-zinc-200";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "backlog":
      return "Backlog";
    case "this_week":
      return "This week";
    case "today":
      return "Today";
    case "done":
      return "Done";
    default:
      return status;
  }
}

function readString(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}

function readOptionalString(data: Record<string, unknown>, key: string) {
  const v = data[key];
  return typeof v === "string" ? v : undefined;
}

function readOptionalNumber(data: Record<string, unknown>, key: string) {
  const v = data[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function formatScheduledDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Event classification — turns raw SSE events into message kinds. This is the
// only place that knows about node names like `intent-classify` or `get_tasks`.
// ---------------------------------------------------------------------------

function classifyActionStarted(
  event: AgentEvent,
  id: string,
): AIChatMessage | null {
  const action = event.action;
  if (!action) return null;
  const data = event.payload;

  if (action === "intent-classify") {
    return {
      id,
      role: "assistant",
      kind: "intent_classify",
      nodeName: "intent-classify",
      status: "running",
      data,
    };
  }

  if (action === "get_tasks") {
    return {
      id,
      role: "assistant",
      kind: "tasks",
      nodeName: "get_tasks",
      status: "running",
      data,
    };
  }

  if (
    action === "create_task" ||
    action === "update_task" ||
    action === "delete_task" ||
    action === "chitchat"
  ) {
    return {
      id,
      role: "assistant",
      kind: action,
      nodeName: action,
      status: "running",
      data,
    };
  }

  // Unknown node — track generically as a chitchat-style progress card.
  return {
    id,
    role: "assistant",
    kind: "chitchat",
    nodeName: action,
    status: "running",
    data,
  };
}

function classifyEvent(event: AgentEvent): AIChatMessage | null {
  if (event.type === "assistant_message") {
    return {
      id: genId(),
      role: "assistant",
      kind: "text",
      data: event.payload,
    };
  }

  if (event.type === "approval_required" && event.operationId) {
    return {
      id: genId(),
      role: "assistant",
      kind: "confirm",
      conversationId: event.conversationId,
      operationId: event.operationId,
      status: "pending",
      data: event.payload,
    };
  }

  if (event.type === "error") {
    const code = readString(event.payload, "code") || "internal";
    const message = readString(event.payload, "message");
    return {
      id: genId(),
      role: "assistant",
      kind: "error",
      data: { code, message, ...event.payload },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : genId(),
  );
  const { collection, getTasks } = useData();
  const [pendingOperationId, setPendingOperationId] = useState<string>();
  const lastMessageId = messages.at(-1)?.id;

  // Tracks action cards by operation+action. A resumed HITL action can replay
  // its start event, so node name alone is not a safe key.
  const runningIds = useRef<Map<string, string>>(new Map());

  // Dedupe refreshes for the same node name within a short window. When the
  // backend emits `start` + `end` for a task we just hit `getTasks()` once.
  // If the user re-fires the same node (e.g. retries), the trailing end is
  // mapped to a fresh stream and we still want to refresh.
  const lastRefreshAt = useRef<Record<string, number>>({});
  const refreshKanbanFor = useCallback(
    (nodeName: string) => {
      const now = Date.now();
      const last = lastRefreshAt.current[nodeName] ?? 0;
      if (now - last < 300) return;
      lastRefreshAt.current[nodeName] = now;
      void getTasks();
    },
    [getTasks],
  );

  useEffect(() => {
    if (lastMessageId && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [lastMessageId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // -------------------------------------------------------------------------
  // Mutation helpers
  // -------------------------------------------------------------------------

  const append = useCallback((m: AIChatMessage) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  const updateStatusAwareById = useCallback(
    (id: string, patch: Partial<StatusAwareMessage>) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? ({ ...m, ...patch } as AIChatMessage) : m,
        ),
      );
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Stream consumer for the versioned event envelope.
  // -------------------------------------------------------------------------

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      if (event.type === "unknown") return;

      const actionKey = event.action
        ? `${event.operationId ?? event.requestId}:${event.action}`
        : undefined;

      if (event.type === "action_started") {
        if (!actionKey) return;
        const id = genId();
        const existingId = runningIds.current.get(actionKey);
        if (existingId) {
          updateStatusAwareById(existingId, {
            status: "running",
            data: event.payload,
          });
        } else {
          runningIds.current.set(actionKey, id);
          const msg = classifyActionStarted(event, id);
          if (msg) append(msg);
        }
        return;
      }

      if (event.type === "approval_required") {
        if (event.operationId) {
          setPendingOperationId(event.operationId);
          if (actionKey) {
            const id = runningIds.current.get(actionKey);
            if (id) {
              updateStatusAwareById(id, { status: "running" });
            }
          }
        }
        const msg = classifyEvent(event);
        if (msg) append(msg);
        return;
      }

      if (event.type === "action_completed") {
        if (!actionKey) return;
        const id = runningIds.current.get(actionKey);
        runningIds.current.delete(actionKey);

        if (id) {
          updateStatusAwareById(id, {
            status: "done",
            data: event.payload,
          });
        } else {
          const kind: MessageKind =
            event.action === "intent-classify"
              ? "intent_classify"
              : event.action === "get_tasks"
                ? "tasks"
                : (event.action as MessageKind);
          append({
            id: genId(),
            role: "assistant",
            kind,
            nodeName: event.action ?? "chitchat",
            status: "done",
            data: event.payload,
          } as AIChatMessage);
        }

        if (
          event.action === "create_task" ||
          event.action === "update_task" ||
          event.action === "delete_task"
        ) {
          if (event.payload.approved !== false) {
            refreshKanbanFor(event.action);
          }
        }
        return;
      }

      if (event.type === "run_completed") {
        if (event.operationId) setPendingOperationId(undefined);
        return;
      }

      if (event.type === "error" && event.operationId) {
        setPendingOperationId(undefined);
        setMessages((prev) =>
          prev.map((message) =>
            message.kind === "confirm" &&
            message.operationId === event.operationId
              ? { ...message, status: "error" }
              : message,
          ),
        );
      }

      const msg = classifyEvent(event);
      if (msg) append(msg);
    },
    [append, refreshKanbanFor, updateStatusAwareById],
  );

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------

  const handleSend = async (text: string) => {
    if (!text.trim() || streaming || pendingOperationId) return;

    const trimmed = text.trim();
    append({
      id: genId(),
      role: "user",
      kind: "user",
      data: { content: trimmed },
    });
    setStreaming(true);

    try {
      await sendAgentMessage({
        message: trimmed,
        conversationId: sessionIdRef.current,
        requestId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : genId(),
        activeCollectionId: collection?.uuid,
        onEvent: handleEvent,
        onError: (code, message) => {
          append({
            id: genId(),
            role: "assistant",
            kind: "error",
            data: { code, message },
          });
          setStreaming(false);
        },
      });
    } finally {
      setStreaming(false);
    }
  };

  // -------------------------------------------------------------------------
  // Confirm / deny
  // -------------------------------------------------------------------------

  const updateConfirmStatus = useCallback(
    (operationId: string, status: ToolApprovalStatus) => {
      setMessages((prev) => {
        const idx = [...prev]
          .reverse()
          .findIndex(
            (m) => m.kind === "confirm" && m.operationId === operationId,
          );
        if (idx === -1) return prev;
        const realIdx = prev.length - 1 - idx;
        const target = prev[realIdx];
        if (target.kind !== "confirm") return prev;
        return [
          ...prev.slice(0, realIdx),
          { ...target, status },
          ...prev.slice(realIdx + 1),
        ];
      });
    },
    [],
  );

  const handleConfirmResponse = useCallback(
    async (confirmMsg: ConfirmMessage, approved: boolean) => {
      setStreaming(true);
      updateConfirmStatus(
        confirmMsg.operationId,
        approved ? "approving" : "denied",
      );

      try {
        await confirmAgentPlan({
          conversationId: confirmMsg.conversationId,
          operationId: confirmMsg.operationId,
          decision: approved ? "approve" : "deny",
          onEvent: handleEvent,
          onError: (code, message) => {
            append({
              id: genId(),
              role: "assistant",
              kind: "error",
              data: { code, message },
            });
            setStreaming(false);
          },
        });
      } finally {
        setStreaming(false);
      }
    },
    [append, handleEvent, updateConfirmStatus],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const renderedMessages = useMemo(
    () =>
      messages.map((m) => ({
        m,
        node: renderMessage(m, {
          onApprove: (msg) => handleConfirmResponse(msg, true),
          onDeny: (msg) => handleConfirmResponse(msg, false),
        }),
      })),
    [messages, handleConfirmResponse],
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed right-4 bottom-4 z-50 flex max-h-[80vh] min-h-[420px] w-[580px] max-w-[calc(100vw-32px)] flex-col overflow-hidden overflow-y-scroll rounded-2xl border-2 border-[#2d2d2d] bg-[#18171b] font-sans shadow-2xl"
          >
            {/* Header */}
            <div className="flex h-10 items-center border-b border-[rgba(77,67,84,0.15)] bg-[rgba(24,23,27,0.97)] px-4">
              <span className="flex-1 text-xs font-medium text-[rgba(229,226,227,0.53)] select-none">
                Linkdo AI – Beta
              </span>
              <button
                type="button"
                onClick={closeChat}
                className="rounded p-1 transition hover:bg-[rgba(229,226,227,0.11)]"
              >
                <IconX size={18} className="text-[rgba(229,226,227,0.50)]" />
              </button>
            </div>

            {/* Message list */}
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-1 flex-col items-center justify-center px-8 select-none"
              >
                <span className="mt-12 text-base font-medium text-white/90">
                  Hey there <span>👋</span>
                </span>
                <span className="mt-2 text-base font-bold text-white">
                  I&apos;m Linkdo, your AI assistant.
                </span>
                <p className="mt-5 max-w-[285px] text-center text-xs leading-relaxed font-normal text-[#c7b9d7]">
                  Just tell me what&apos;s on your mind and I can turn
                  <br />
                  your thoughts into tasks, notes, subtasks, and
                  <br />
                  even schedule them for you.
                </p>
              </motion.div>
            ) : (
              <div className="list flex-1 overflow-y-auto px-4 py-3">
                <MessageScroller
                  navigation="rail"
                  className="h-[520px]"
                  viewportClassName="px-4 py-5"
                  contentClassName="min-h-full"
                >
                  <MessageGroup spacing="default">
                    {renderedMessages.map(({ m, node }) => (
                      <Message key={m.id} from={m.role} animateIn>
                        <MessageAvatar>
                          {m.role === "user" ? "Ax" : "AI"}
                        </MessageAvatar>
                        <MessageContent>
                          <MessageBubble
                            variant={m.role === "user" ? "solid" : "outline"}
                          >
                            <MessageBubbleContent>{node}</MessageBubbleContent>
                          </MessageBubble>
                        </MessageContent>
                      </Message>
                    ))}
                  </MessageGroup>
                </MessageScroller>

                {streaming && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex justify-start"
                  >
                    <div className="max-w-[80%] rounded-2xl bg-[#2a2830] px-4 py-2 text-sm text-[#e5e2e3]">
                      <ReasoningText
                        variant="swap"
                        phrases={[
                          "Thinking",
                          "Reading the request",
                          "Working through the details",
                          "Preparing the answer",
                        ]}
                        className="text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="p-3">
              <PromptInput
                models={[]}
                actions={[]}
                defaultValue=""
                loading={streaming || Boolean(pendingOperationId)}
                onSubmit={handleSend}
                onStop={() => {}}
                onAction={(_action) => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.button
            key="floating-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={toggleChat}
            className="border-accent hover:border-accent-hover fixed right-8 bottom-20 z-50 flex size-12 items-center justify-center rounded-full border bg-[#7ba4e8] shadow-lg"
          >
            <IconAi size={32} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Per-kind renderer
// ---------------------------------------------------------------------------

interface RenderHandlers {
  onApprove: (msg: ConfirmMessage) => void;
  onDeny: (msg: ConfirmMessage) => void;
}

function renderMessage(
  msg: AIChatMessage,
  handlers: RenderHandlers,
): React.ReactNode {
  switch (msg.kind) {
    case "user":
      return (
        <span className="whitespace-pre-wrap">
          {typeof msg.data.content === "string" ? msg.data.content : ""}
        </span>
      );

    case "text":
      return (
        <span className="whitespace-pre-wrap">
          {typeof msg.data.content === "string" ? msg.data.content : ""}
        </span>
      );

    case "intent_classify": {
      const plan = asRecord(msg.data.plan);
      const intent = readOptionalString(plan, "intent");
      const violations = Array.isArray(plan.violations)
        ? (plan.violations as unknown[])
        : [];
      const params = asRecord(plan.params);
      return (
        <div className="flex flex-col gap-1.5">
          <StepHeader
            label={nodeLabel("intent-classify")}
            status={msg.status ?? "running"}
          />
          {intent ? (
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag tone="violet">{intentLabel(intent)}</Tag>
                {violations.map((v) => (
                  <Tag key={String(v)} tone="rose">
                    {String(v)}
                  </Tag>
                ))}
                {violations.length === 0 && <Tag tone="emerald">无违规</Tag>}
              </div>
              {Object.keys(params).length > 0 && (
                <IntentParams intent={intent} params={params} />
              )}
            </div>
          ) : null}
        </div>
      );
    }

    case "tasks": {
      const tasks = Array.isArray(msg.data.tasks) ? msg.data.tasks : [];
      const collectionName = readString(msg.data, "collection_name");
      return (
        <div className="flex flex-col gap-1.5">
          <StepHeader
            label={nodeLabel("get_tasks")}
            status={msg.status ?? "running"}
          />
          {msg.status !== "running" && (
            <TasksTable collectionName={collectionName} tasks={tasks} />
          )}
        </div>
      );
    }

    case "create_task":
    case "update_task":
    case "delete_task":
    case "chitchat":
      return (
        <NodeCard
          kind={msg.kind}
          nodeName={msg.nodeName}
          data={msg.data}
          status={msg.status ?? "running"}
        />
      );

    case "confirm":
      return (
        <ConfirmPreviewCard
          data={msg.data}
          status={msg.status ?? "pending"}
          onApprove={() => handlers.onApprove(msg)}
          onDeny={() => handlers.onDeny(msg)}
        />
      );

    case "error": {
      const code = readString(msg.data, "code") || "internal";
      const message = readString(msg.data, "message");
      return (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          <div className="font-semibold">错误 [{code}]</div>
          <div className="mt-0.5 text-rose-100/80">{message}</div>
        </div>
      );
    }

    default: {
      const _exhaustive: never = msg;
      return _exhaustive;
    }
  }
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

// ---------------------------------------------------------------------------
// Card components
// ---------------------------------------------------------------------------

function StepHeader({
  label,
  status,
}: {
  label: string;
  status: "running" | "done";
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-white/85">
      <span
        className={
          status === "running"
            ? "inline-block size-1.5 animate-pulse rounded-full bg-amber-400"
            : "inline-flex size-3 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300"
        }
      >
        {status === "done" ? (
          <IconCheck size={8} className="text-emerald-200" />
        ) : null}
      </span>
      <span>{label}</span>
      {status === "done" ? <Tag tone="emerald">已完成</Tag> : null}
    </div>
  );
}

function NodeCard({
  kind,
  nodeName,
  data,
  status,
}: {
  kind: "create_task" | "update_task" | "delete_task" | "chitchat";
  nodeName: string;
  data: Record<string, unknown>;
  status: "running" | "done";
}) {
  const mutationWasCancelled =
    status === "done" && kind !== "chitchat" && isCancelledMutation(data);

  return (
    <div className="flex flex-col gap-1.5">
      <StepHeader label={nodeLabel(nodeName)} status={status} />
      {mutationWasCancelled ? <CancelledMutationCard kind={kind} /> : null}
      {status === "done" && !mutationWasCancelled && kind === "create_task" ? (
        <CreateTaskDoneCard data={data} />
      ) : null}
      {status === "done" && !mutationWasCancelled && kind === "update_task" ? (
        <UpdateTaskDoneCard data={data} />
      ) : null}
      {status === "done" && !mutationWasCancelled && kind === "delete_task" ? (
        <DeleteCard data={data} />
      ) : null}
      {status === "done" && kind === "chitchat" ? (
        <DoneSummary data={data} />
      ) : null}
    </div>
  );
}

function CancelledMutationCard({
  kind,
}: {
  kind: "create_task" | "update_task" | "delete_task";
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
      已取消{intentLabel(kind)}
    </div>
  );
}

function CreateTaskDoneCard({ data }: { data: Record<string, unknown> }) {
  const title =
    readOptionalString(data, "title") ??
    readOptionalString(data, "name") ??
    "(未命名)";
  const status = readString(data, "status") || "backlog";
  const collectionName = readString(data, "collection_name");
  const taskUuid = readString(data, "uuid");
  const estimatedTime = readOptionalNumber(data, "estimated_time");
  const scheduledDate = readOptionalString(data, "scheduled_date");

  return (
    <div className="flex flex-col gap-1.5">
      <TaskCard
        title={title}
        status={status}
        collectionName={collectionName}
        taskUuid={taskUuid}
      />
      <TaskFieldList
        entries={
          [
            estimatedTime !== undefined
              ? { key: "预估", value: `${estimatedTime} 分钟` }
              : null,
            scheduledDate
              ? {
                  key: "计划日期",
                  value: formatScheduledDate(scheduledDate),
                }
              : null,
          ].filter(Boolean) as { key: string; value: string }[]
        }
      />
    </div>
  );
}

function UpdateTaskDoneCard({ data }: { data: Record<string, unknown> }) {
  const title =
    readOptionalString(data, "title") ??
    readOptionalString(data, "name") ??
    "(未命名)";
  const status = readString(data, "status") || "backlog";
  const collectionName = readString(data, "collection_name");
  const taskUuid = readString(data, "uuid");
  const before = asRecord(data.before);
  const after = asRecord(data.after);

  return (
    <div className="flex flex-col gap-1.5">
      <TaskCard
        title={title}
        status={status}
        collectionName={collectionName}
        taskUuid={taskUuid}
      />
      {Object.keys(before).length > 0 || Object.keys(after).length > 0 ? (
        <DiffList before={before} after={after} />
      ) : null}
    </div>
  );
}

function DeleteCard({ data }: { data: Record<string, unknown> }) {
  const collectionName = readString(data, "collection_name");
  const taskUuid =
    readOptionalString(data, "task_uuid") ?? readOptionalString(data, "uuid");
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
      <div className="font-medium">已删除任务</div>
      <div className="mt-0.5 text-rose-100/80">
        集合「{collectionName || "—"}」{taskUuid ? ` · ${taskUuid}` : ""}
      </div>
    </div>
  );
}

function DoneSummary({ data }: { data: Record<string, unknown> }) {
  const message =
    readOptionalString(data, "message") ??
    readOptionalString(data, "content") ??
    "";
  if (!message) return null;
  return <p className="text-xs whitespace-pre-wrap text-white/85">{message}</p>;
}

function ConfirmPreviewCard({
  data,
  status,
  onApprove,
  onDeny,
}: {
  data: Record<string, unknown>;
  status: ToolApprovalStatus;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const intent = readString(data, "intent");
  const summary = readString(data, "summary");
  const preview = asRecord(data.preview);
  const collectionName = readString(preview, "collection_name");
  const taskUuid = readString(preview, "task_uuid");
  const fields = asRecord(preview.fields);
  const before = asRecord(preview.before);
  const after = asRecord(preview.after);

  const parameters: { id: string; label: string; value: React.ReactNode }[] = [
    {
      id: "intent",
      label: "Intent",
      value: <Tag tone="violet">{intentLabel(intent)}</Tag>,
    },
  ];
  if (collectionName) {
    parameters.push({
      id: "collection",
      label: "集合",
      value: <span>{collectionName}</span>,
    });
  }
  if (taskUuid) {
    parameters.push({
      id: "task",
      label: "任务",
      value: (
        <span className="font-mono text-[11px] text-white/70">{taskUuid}</span>
      ),
    });
  }

  let details: React.ReactNode = null;
  if (intent === "create_task" && Object.keys(fields).length > 0) {
    details = <ConfirmCreateFields fields={fields} />;
  } else if (intent === "update_task") {
    details = <DiffList before={before} after={after} />;
  } else if (intent === "delete_task") {
    const title = readOptionalString(before, "title") ?? "(未命名)";
    details = (
      <div className="rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-100/85">
        将删除任务《{title}》
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <ToolApproval
        tool={collectionName || intent || "tool"}
        title={
          status === "pending"
            ? "是否执行该任务"
            : status === "approved"
              ? "已执行"
              : status === "denied"
                ? "已拒绝"
                : "处理中"
        }
        description={summary}
        status={status}
        open
        onOpenChange={() => {}}
        parameters={parameters}
        onApprove={onApprove}
        onDeny={onDeny}
      />
      {details}
    </div>
  );
}

function ConfirmCreateFields({ fields }: { fields: Record<string, unknown> }) {
  const title = readOptionalString(fields, "title");
  const status = readOptionalString(fields, "status");
  const estimatedTime = readOptionalNumber(fields, "estimated_time");
  const scheduledDate = readOptionalString(fields, "scheduled_date");
  const notionDatabaseUuid = readOptionalString(fields, "notion_database_uuid");
  const clickUpListUuid = readOptionalString(fields, "clickup_list_uuid");

  const entries: { key: string; value: React.ReactNode }[] = [];
  if (title)
    entries.push({
      key: "标题",
      value: <span className="font-medium">{title}</span>,
    });
  if (status)
    entries.push({
      key: "状态",
      value: <Tag tone="amber">{statusLabel(status)}</Tag>,
    });
  if (estimatedTime !== undefined) {
    entries.push({ key: "预估", value: `${estimatedTime} 分钟` });
  }
  if (scheduledDate) {
    entries.push({
      key: "计划日期",
      value: formatScheduledDate(scheduledDate),
    });
  }
  if (notionDatabaseUuid) {
    entries.push({
      key: "Notion DB",
      value: (
        <span className="font-mono text-[11px] text-white/70">
          {notionDatabaseUuid}
        </span>
      ),
    });
  }
  if (clickUpListUuid) {
    entries.push({
      key: "ClickUp List",
      value: (
        <span className="font-mono text-[11px] text-white/70">
          {clickUpListUuid}
        </span>
      ),
    });
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-white/55">
        暂无可预览字段
      </div>
    );
  }

  return (
    <div className="grid w-full gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-[11px]">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] gap-2"
        >
          <span className="truncate text-white/55">{entry.key}</span>
          <span className="truncate text-white/90">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function DiffList({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)]),
  );
  const rows = keys
    .map((key) => {
      const oldVal = before[key];
      const newVal = after[key];
      const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
      return { key, oldVal, newVal, changed };
    })
    .filter((row) => row.changed);

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-white/55">
        没有差异
      </div>
    );
  }

  return (
    <div className="grid w-full gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-[11px]">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-0.5">
          <span className="text-white/55">{row.key}</span>
          <div className="grid grid-cols-2 gap-2">
            <span className="truncate rounded bg-rose-500/10 px-1.5 py-0.5 font-mono text-rose-100/80">
              {formatDiffValue(row.oldVal)}
            </span>
            <span className="truncate rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-emerald-100/85">
              {formatDiffValue(row.newVal)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDiffValue(v: unknown): string {
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "string") return v || "—";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function TaskCard({
  title,
  status,
  collectionName,
  taskUuid,
}: {
  title: string;
  status: string;
  collectionName: string;
  taskUuid: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 font-medium text-white/95">{title}</div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-white/45">
            {taskUuid}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(status)}`}
        >
          {statusLabel(status)}
        </span>
      </div>
      {collectionName ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Tag tone="blue">{collectionName}</Tag>
        </div>
      ) : null}
    </div>
  );
}

function TaskFieldList({
  entries,
}: {
  entries: { key: string; value: string }[];
}) {
  if (entries.length === 0) return null;
  return (
    <div className="grid w-full gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-[11px]">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] gap-2"
        >
          <span className="truncate text-white/55">{entry.key}</span>
          <span className="truncate text-white/90">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function IntentParams({
  intent,
  params,
}: {
  intent: string;
  params: Record<string, unknown>;
}) {
  if (intent === "create_task") {
    const title = readOptionalString(params, "title");
    const collection = readOptionalString(params, "collection");
    const estimatedTime = readOptionalNumber(params, "estimated_time");
    const status = readOptionalString(params, "status");
    const scheduledDate = readOptionalString(params, "scheduled_date");

    const known = [
      title ? { key: "标题", value: title } : null,
      collection ? { key: "集合", value: collection } : null,
      estimatedTime !== undefined
        ? { key: "预估", value: `${estimatedTime} 分钟` }
        : null,
      status ? { key: "状态", value: status } : null,
      scheduledDate
        ? { key: "计划日期", value: formatScheduledDate(scheduledDate) }
        : null,
    ].filter(Boolean) as { key: string; value: string }[];

    const extraEntries = Object.entries(params).filter(
      ([key]) =>
        ![
          "title",
          "collection",
          "estimated_time",
          "status",
          "scheduled_date",
        ].includes(key),
    );

    return (
      <div className="flex flex-col gap-1.5">
        <TaskFieldList entries={known} />
        {extraEntries.length > 0 ? (
          <ParamList params={Object.fromEntries(extraEntries)} />
        ) : null}
      </div>
    );
  }

  if (intent === "update_task") {
    const taskId = readOptionalString(params, "task_id");
    const collection = readOptionalString(params, "collection");
    const title = readOptionalString(params, "title");
    const content = readOptionalString(params, "content");
    const known = [
      taskId ? { key: "任务 ID", value: taskId } : null,
      collection ? { key: "集合", value: collection } : null,
      title ? { key: "新标题", value: title } : null,
      content ? { key: "新内容", value: content } : null,
    ].filter(Boolean) as { key: string; value: string }[];
    return <TaskFieldList entries={known} />;
  }

  if (intent === "delete_task") {
    const taskId = readOptionalString(params, "task_id");
    const collection = readOptionalString(params, "collection");
    const known = [
      taskId ? { key: "任务 ID", value: taskId } : null,
      collection ? { key: "集合", value: collection } : null,
    ].filter(Boolean) as { key: string; value: string }[];
    return <TaskFieldList entries={known} />;
  }

  if (intent === "get_tasks") {
    const collection = readOptionalString(params, "collection");
    return (
      <TaskFieldList
        entries={collection ? [{ key: "集合", value: collection }] : []}
      />
    );
  }

  // chitchat / unknown — fall back to a raw key/value list.
  return <ParamList params={params} />;
}

function TasksTable({
  collectionName,
  tasks,
}: {
  collectionName: string;
  tasks: unknown[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {collectionName ? <Tag tone="blue">{collectionName}</Tag> : null}
        <Tag tone="amber">{tasks.length} 个任务</Tag>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-[11px] text-white/85">
          <thead className="bg-white/5 text-[10px] tracking-wider text-white/55 uppercase">
            <tr>
              <th className="px-2 py-1.5 font-medium">任务</th>
              <th className="px-2 py-1.5 font-medium">状态</th>
              <th className="px-2 py-1.5 text-right font-medium">估算</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map((task, idx) => {
              const t = asRecord(task);
              const uuid = readString(t, "uuid");
              const title = readString(t, "title") || "(未命名)";
              const status = readString(t, "status") || "backlog";
              const estimatedTime =
                typeof t.estimated_time === "number" ? t.estimated_time : null;
              return (
                <tr key={uuid || idx} className="hover:bg-white/5">
                  <td className="px-2 py-1.5">
                    <div className="line-clamp-1 font-medium text-white/90">
                      {title}
                    </div>
                    <div className="truncate font-mono text-[10px] text-white/45">
                      {uuid}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(status)}`}
                    >
                      {statusLabel(status)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right text-white/70">
                    {estimatedTime !== null ? `${estimatedTime}m` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Tag({
  tone,
  children,
}: {
  tone: "violet" | "emerald" | "rose" | "amber" | "blue" | "slate";
  children: React.ReactNode;
}) {
  const toneClass: Record<typeof tone, string> = {
    violet: "bg-violet-500/15 text-violet-200 border-violet-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-200 border-rose-500/30",
    amber: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    blue: "bg-blue-500/15 text-blue-200 border-blue-500/30",
    slate: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

function ParamList({ params }: { params: Record<string, unknown> }) {
  return (
    <div className="mt-1 grid w-full gap-1 rounded-md border border-white/10 bg-white/5 p-2 text-[11px]">
      {Object.entries(params).map(([k, v]) => (
        <div
          key={k}
          className="grid grid-cols-[minmax(0,5rem)_minmax(0,1fr)] gap-2"
        >
          <span className="truncate text-white/55">{k}</span>
          <span className="truncate font-mono text-white/85">
            {typeof v === "string" ? v : JSON.stringify(v)}
          </span>
        </div>
      ))}
    </div>
  );
}
