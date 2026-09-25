import { describe, expect, it } from "vitest";

import { hasCompleteStatusMapping } from "./status-mapping";

describe("hasCompleteStatusMapping", () => {
  it("requires every Linkdo column to have a remote status", () => {
    expect(
      hasCompleteStatusMapping({
        backlog: "Not started",
        this_week: "In progress",
        today: "",
        done: "Complete",
      }),
    ).toBe(false);
  });

  it("accepts a complete mapping, including duplicate remote statuses", () => {
    expect(
      hasCompleteStatusMapping({
        backlog: "Not started",
        this_week: "In progress",
        today: "In progress",
        done: "Complete",
      }),
    ).toBe(true);
  });
});
