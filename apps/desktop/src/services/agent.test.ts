import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildAgentConfirmationRequest,
  buildAgentMessageRequest,
  buildAgentQuestionAnswerRequest,
  confirmAgentPlan,
  isCancelledMutation,
  parseAgentEvent,
} from "./agent";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("agent protocol", () => {
  it("builds the unified message input with context and correlations", () => {
    expect(
      buildAgentMessageRequest({
        conversationId: "conversation-1",
        requestId: "request-1",
        message: "新建任务：买菜",
        activeCollectionId: "collection-1",
      }),
    ).toEqual({
      conversation_id: "conversation-1",
      request_id: "request-1",
      context: { active_collection_id: "collection-1" },
      input: { message: "新建任务：买菜" },
    });
  });

  it("builds the Human in the Loop confirmation input", () => {
    expect(
      buildAgentConfirmationRequest({
        conversationId: "conversation-1",
        operationId: "operation-1",
        decision: "approve",
      }),
    ).toEqual({
      conversation_id: "conversation-1",
      operation_id: "operation-1",
      decision: "approve",
    });
  });

  it("builds a selected answer for a Human in the Loop question", () => {
    expect(
      buildAgentQuestionAnswerRequest({
        conversationId: "conversation-1",
        operationId: "question-1",
        answer: "任务 A",
      }),
    ).toEqual({
      conversation_id: "conversation-1",
      operation_id: "question-1",
      answer: "任务 A",
    });
  });

  it("parses a correlated approval event without exposing implementation fields", () => {
    expect(
      parseAgentEvent(
        JSON.stringify({
          v: 1,
          type: "approval_required",
          conversation_id: "conversation-1",
          request_id: "request-1",
          operation_id: "operation-1",
          action: "delete_task",
          payload: { intent: "delete_task", summary: "删除任务" },
        }),
      ),
    ).toEqual({
      v: 1,
      type: "approval_required",
      conversationId: "conversation-1",
      requestId: "request-1",
      operationId: "operation-1",
      action: "delete_task",
      payload: { intent: "delete_task", summary: "删除任务" },
    });
  });

  it("parses a correlated question event separately from approvals", () => {
    expect(
      parseAgentEvent(
        JSON.stringify({
          v: 1,
          type: "question_required",
          conversation_id: "conversation-1",
          request_id: "request-1",
          operation_id: "question-1",
          payload: { question: "请选择任务", options: [] },
        }),
      ),
    ).toMatchObject({ type: "question_required", operationId: "question-1" });
  });

  it("recognises denied mutations as cancelled rather than successful", () => {
    expect(isCancelledMutation({ approved: false })).toBe(true);
    expect(isCancelledMutation({ approved: true })).toBe(false);
    expect(isCancelledMutation({})).toBe(false);
  });

  it("posts HITL confirmations to the interrupt endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.close();
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await confirmAgentPlan({
      conversationId: "conversation-1",
      operationId: "operation-1",
      decision: "approve",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:6001/api/chat/interrupt-human-in-the-loop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          conversation_id: "conversation-1",
          operation_id: "operation-1",
          decision: "approve",
        }),
      }),
    );
  });
});
