import { describe, expect, it } from "vitest";

import type { ITask } from "@/types/base";
import { searchTasksByTitle } from "./task-search";

const task = (uuid: string, title: string): ITask => ({
  uuid,
  collection_uuid: "collection-1",
  title,
  content: "",
  status: "today",
  estimated_time: 0,
  actual_time: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("searchTasksByTitle", () => {
  it("matches task titles case-insensitively", () => {
    const tasks = [task("1", "Write release notes"), task("2", "Plan sprint")];

    expect(searchTasksByTitle(tasks, "RELEASE")).toEqual([tasks[0]]);
  });

  it("does not return tasks until the user enters a query", () => {
    expect(
      searchTasksByTitle([task("1", "Write release notes")], "  "),
    ).toEqual([]);
  });
});
