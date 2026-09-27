import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { answerAgentQuestion, confirmAgentPlan, sendAgentMessage } = vi.hoisted(
  () => ({
    answerAgentQuestion: vi.fn(),
    confirmAgentPlan: vi.fn(),
    sendAgentMessage: vi.fn(),
  }),
);

vi.mock("@/app/work/data-provider", () => ({
  useData: () => ({ collection: undefined, getTasks: vi.fn() }),
}));

vi.mock("@/services/agent", () => ({
  answerAgentQuestion,
  sendAgentMessage,
  confirmAgentPlan,
  isCancelledMutation: () => false,
}));

vi.mock("../agents/prompt-input", () => ({
  PromptInput: ({ onSubmit }: { onSubmit: (message: string) => void }) => (
    <button type="button" onClick={() => onSubmit("列出集合")}>
      send
    </button>
  ),
}));

vi.mock("../agents/message", () => ({
  Message: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MessageAvatar: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MessageBubble: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MessageBubbleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MessageContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MessageGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  MessageScroller: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../agents/loading-states/reasoning-text", () => ({
  ReasoningText: () => <span>thinking</span>,
}));

vi.mock("../agents/tool-approval", () => ({
  ToolApproval: ({
    description,
    parameters,
    status,
    title,
    tool,
    onApprove,
  }: {
    description: React.ReactNode;
    parameters: {
      id: string;
      label: React.ReactNode;
      value: React.ReactNode;
    }[];
    status: string;
    title: React.ReactNode;
    tool: React.ReactNode;
    onApprove: () => void;
  }) => (
    <div>
      <div>{title}</div>
      <div>{tool}</div>
      <div>{description}</div>
      <div>{status}</div>
      {parameters.map((parameter) => (
        <div key={parameter.id}>
          {parameter.label}: {parameter.value}
        </div>
      ))}
      <button type="button" onClick={onApprove}>
        approve
      </button>
    </div>
  ),
}));

import AIChat from "./index";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AIChat", () => {
  it("renders a completed unknown tool action instead of rendering its message object", async () => {
    sendAgentMessage.mockImplementation(async (options) => {
      options.onEvent({
        v: 1,
        type: "action_completed",
        conversationId: "conversation-1",
        requestId: "request-1",
        operationId: "tool-message-1",
        action: "get_all_collections",
        payload: {},
      });
    });

    render(<AIChat />);
    fireEvent.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() =>
      expect(screen.getByText("get_all_collections")).toBeTruthy(),
    );
  });

  it("shows the deletion target and marks its approval as executed after completion", async () => {
    sendAgentMessage.mockImplementation(async (options) => {
      options.onEvent({
        v: 1,
        type: "approval_required",
        conversationId: "conversation-1",
        requestId: "request-1",
        operationId: "interrupt-1",
        action: "delete_task",
        payload: {
          intent: "delete_task",
          summary: "该操作将永久删除任务。请确认是否执行。",
          preview: {
            task_uuid: "task-1",
            before: { title: "晚上打扫卫生" },
          },
        },
      });
    });
    confirmAgentPlan.mockImplementation(async (options) => {
      options.onEvent({
        v: 1,
        type: "action_completed",
        conversationId: "conversation-1",
        requestId: "interrupt-1",
        operationId: "interrupt-1",
        action: "delete_task",
        payload: { deleted: true },
      });
    });

    render(<AIChat />);
    fireEvent.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          (_, element) => element?.textContent === "将删除任务《晚上打扫卫生》",
        ),
      ).toBeTruthy(),
    );
    expect(
      screen.getByText("该操作将永久删除任务。请确认是否执行。"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "approve" }));

    await waitFor(() => expect(screen.getByText("已执行")).toBeTruthy());
  });

  it("renders an ask-user question as choices instead of a destructive approval", async () => {
    sendAgentMessage.mockImplementation(async (options) => {
      options.onEvent({
        v: 1,
        type: "question_required",
        conversationId: "conversation-1",
        requestId: "request-1",
        operationId: "question-1",
        payload: {
          question: "请选择要删除的任务",
          options: [
            { title: "任务 A", description: "今天", recommended: true },
            { title: "任务 B", description: "明天", recommended: false },
          ],
        },
      });
    });

    render(<AIChat />);
    fireEvent.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() =>
      expect(screen.getByText("请选择要删除的任务")).toBeTruthy(),
    );
    expect(screen.queryByText("是否执行该任务")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /任务 A/ }));
    expect(answerAgentQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ answer: "任务 A", operationId: "question-1" }),
    );
  });
});
