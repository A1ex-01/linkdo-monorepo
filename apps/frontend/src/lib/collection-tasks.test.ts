import { describe, expect, it } from "vitest";

import type { ITask } from "@/types/base";
import { getTaskPreview } from "./collection-tasks";

const task = (uuid: string): ITask => ({
  uuid,
  collection_uuid: "collection-1",
  title: `Task ${uuid}`,
  content: "",
  status: "today",
  estimated_time: 0,
  actual_time: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("getTaskPreview", () => {
  it("returns no more than five tasks in their supplied order", () => {
    expect(getTaskPreview(["1", "2", "3", "4", "5", "6"].map(task))).toEqual(
      ["1", "2", "3", "4", "5"].map(task),
    );
  });
});
