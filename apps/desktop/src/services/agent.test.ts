import { describe, expect, it } from "vitest";

import {
  buildAgentMessageRequest,
  isCancelledMutation,
  parseAgentEvent,
} from "./agent";

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

  it("recognises denied mutations as cancelled rather than successful", () => {
    expect(isCancelledMutation({ approved: false })).toBe(true);
    expect(isCancelledMutation({ approved: true })).toBe(false);
    expect(isCancelledMutation({})).toBe(false);
  });
});
