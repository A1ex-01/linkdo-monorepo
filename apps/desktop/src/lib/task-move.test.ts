import { describe, expect, it } from "vitest";

import type { ITask } from "@/types/base";
import { applyOptimisticTaskMove } from "./task-move";

const task = (uuid: string, status: ITask["status"]): ITask => ({
  uuid,
  collection_uuid: "collection-1",
  title: `Task ${uuid}`,
  content: "",
  status,
  estimated_time: 0,
  actual_time: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("applyOptimisticTaskMove", () => {
  it("keeps a task visible when moving Today into an empty Done column", () => {
    const result = applyOptimisticTaskMove({
      tasks: [task("today-1", "today")],
      taskUuid: "today-1",
      sourceStatus: "today",
      destinationStatus: "done",
      destinationIndex: 0,
    });

    expect(result).toEqual([
      expect.objectContaining({
        uuid: "today-1",
        status: "done",
      }),
    ]);
  });
});
