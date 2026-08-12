"use client";

import { useData } from "@/app/work/data-provider";
import { confirmAgentPlan, type PlanStep } from "@/services/agent";
import { IconAi, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { ToolApproval, ToolApprovalStatus } from "../agents/tool-approval";
import { Input } from "../ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageRole = "user" | "assistant";

interface AIChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  loading?: boolean;
  needConfirm?: boolean;
  status?: ToolApprovalStatus;
}

interface ConfirmState {
  sessionId: string;
  intent: string;
  summary: string;
  steps: PlanStep[];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function genId() {
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { id: genId(), role: "assistant", content: "你好，有什么可以帮您的吗？" },
    { id: genId(), role: "user", content: "我需要帮助处理我的项目" },
    {
      id: genId(),
      role: "assistant",
      content: "好的，我可以协助您。您具体需要哪方面的帮助？",
    },
    { id: genId(), role: "user", content: "我需要帮助处理我的项目" },
    { id: genId(), role: "assistant", content: "你好，有什么可以帮您的吗？" },
    { id: genId(), role: "user", content: "我需要帮助处理我的项目" },
    {
      id: genId(),
      role: "assistant",
      content: "好的，我可以协助您。您具体需要哪方面的帮助？",
    },
    { id: genId(), role: "user", content: "我需要帮助处理我的项目" },
    { id: genId(), role: "assistant", content: "你好，有什么可以帮您的吗？" },
    { id: genId(), role: "user", content: "我需要帮助处理我的项目" },
    {
      id: genId(),
      role: "assistant",
      content: "好的，我可以协助您。您具体需要哪方面的帮助？",
    },
    { id: genId(), role: "user", content: "我需要帮助处理我的项目" },
    {
      id: genId(),
      role: "assistant",
      content: "",
      needConfirm: true,
      status: "pending",
    },
  ]);
  const [confirmData, setConfirmData] = useState<{
    uuid: string;
    content: string;
  }>({
    uuid: "a-b-c",
    content: "这是内容",
  });
  const [input, setInput] = useState("");
  const { getTasks } = useData();
  const [streaming, setStreaming] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  // accumulated text for the current streaming assistant message
  const [draftText, setDraftText] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages or draft change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, draftText]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------

  const appendUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", content: text },
    ]);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || streaming) return;

    const trimmed = text.trim();
    appendUserMessage(trimmed);
    setInput("");
    setStreaming(true);
    setDraftText("");
    setConfirm(null);

    // await sendAgentMessage({
    //   message: trimmed,
    //   onConfirmRequired: (intent, summary, steps, sessionId) => {
    //     setConfirm({ sessionId, intent, summary, steps });
    //     setStreaming(false);
    //   },
    //   onExecuteStart: () => {
    //     setDraftText("");
    //   },
    //   onText: (content) => {
    //     setDraftText(content);
    //   },
    //   onDone: (message) => {
    //     setMessages((prev) => [
    //       ...prev,
    //       { id: genId(), role: "assistant", content: message },
    //     ]);
    //     setDraftText("");
    //     setStreaming(false);
    //   },
    //   onError: (code, message) => {
    //     setMessages((prev) => [
    //       ...prev,
    //       {
    //         id: genId(),
    //         role: "assistant",
    //         content: `错误 [${code}]: ${message}`,
    //       },
    //     ]);
    //     setDraftText("");
    //     setStreaming(false);
    //   },
    // });
  };

  // -------------------------------------------------------------------------
  // Confirm plan
  // -------------------------------------------------------------------------

  const handleConfirm = async () => {
    if (!confirm) return;
    setStreaming(true);
    setDraftText("");
    const { sessionId } = confirm;
    setConfirm(null);

    await confirmAgentPlan({
      sessionId,
      onExecuteStart: () => {},
      onText: (content) => {
        setDraftText(content);
      },
      onDone: (message) => {
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: "assistant", content: message },
        ]);
        setDraftText("");
        setStreaming(false);
        getTasks();
      },
      onError: (code, message) => {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: "assistant",
            content: `错误 [${code}]: ${message}`,
          },
        ]);
        setDraftText("");
        setStreaming(false);
      },
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

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
            className="border-primary-500 fixed right-4 bottom-4 z-50 flex max-h-[80vh] min-h-[420px] w-[580px] max-w-[calc(100vw-32px)] flex-col overflow-hidden overflow-y-scroll rounded-2xl border-2 bg-[#18171b] font-sans shadow-2xl"
          >
            {/* Header */}
            <div className="flex h-10 items-center border-b border-[rgba(77,67,84,0.15)] bg-[rgba(24,23,27,0.97)] px-4">
              <span className="flex-1 text-xs font-medium text-[rgba(229,226,227,0.53)] select-none">
                LinkDo AI – Beta
              </span>
              <button
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
                  I&apos;m LinkDo, your AI assistant.
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
                    {messages.map((msg) => {
                      let content = null;
                      if (msg?.loading) {
                        content = (
                          <div>
                            <ReasoningText
                              variant={"swap"}
                              phrases={[
                                "Thinking",
                                "Reading the request",
                                "Working through the details",
                                "Preparing the answer",
                              ]}
                              className="text-sm"
                            />
                          </div>
                        );
                      }
                      if (msg?.needConfirm) {
                        content = (
                          <div>
                            <ToolApproval
                              tool="是否执行该任务"
                              title={
                                msg?.status === "pending"
                                  ? "是否执行该任务"
                                  : "已执行"
                              }
                              description="是否执行该任务"
                              status={msg?.status}
                              open={true}
                              onOpenChange={() => {}}
                              parameters={[
                                {
                                  id: "uuid",
                                  label: "UUID",
                                  value: (
                                    <Input
                                      onChange={(e) =>
                                        setConfirmData({
                                          ...confirmData,
                                          uuid: e.target.value,
                                        })
                                      }
                                      disabled={msg?.status === "approved"}
                                      defaultValue={confirmData?.uuid}
                                    />
                                  ),
                                },
                                {
                                  id: "content",
                                  label: "Content",
                                  value: (
                                    <Input
                                      onChange={(e) =>
                                        setConfirmData({
                                          ...confirmData,
                                          content: e.target.value,
                                        })
                                      }
                                      disabled={msg?.status === "approved"}
                                      defaultValue={confirmData?.content}
                                    />
                                  ),
                                },
                              ]}
                              onApprove={() => {
                                const lastMessage =
                                  messages[messages.length - 1];
                                setMessages((prev) => [
                                  ...prev.slice(0, -1),
                                  {
                                    ...lastMessage,
                                    status: "approved",
                                  },
                                  {
                                    id: genId(),
                                    role: "assistant",
                                    content: `批准了 UUID: ${confirmData?.uuid}，内容: ${confirmData?.content}`,
                                  },
                                ]);
                                // clearTimers();
                                // setStatus("approving");
                                // timers.current = [
                                //   window.setTimeout(() => setStatus("approved"), 600),
                                //   window.setTimeout(() => setStatus("running"), 1150),
                                //   window.setTimeout(() => setStatus("complete"), 2200),
                                // ];
                              }}
                              onDeny={() => {
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: genId(),
                                    role: "assistant",
                                    content: "拒绝成功",
                                    status: "denied",
                                  },
                                ]);
                              }}
                            />
                          </div>
                        );
                      }
                      return (
                        <Message key={msg?.id} from={msg?.role} animateIn>
                          <MessageAvatar>
                            {msg?.role === "user" ? "Ax" : "AI"}
                          </MessageAvatar>
                          <MessageContent>
                            <MessageBubble
                              variant={
                                msg?.role === "user" ? "solid" : "outline"
                              }
                            >
                              <MessageBubbleContent>
                                {content || msg?.content}
                              </MessageBubbleContent>
                            </MessageBubble>
                          </MessageContent>
                        </Message>
                      );
                    })}
                  </MessageGroup>
                </MessageScroller>

                {streaming && !draftText && !confirm && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex justify-start"
                  >
                    <div className="max-w-[80%] rounded-2xl bg-[#2a2830] px-4 py-2 text-sm text-[#e5e2e3]">
                      <span className="animate-pulse">思考中...</span>
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
                loading={false}
                onSubmit={handleSend}
                onStop={() => {}}
                onAction={(action) => {}}
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
