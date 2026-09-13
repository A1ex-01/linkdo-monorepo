import { describe, expect, it } from "vitest";

import { getEstimatedMinutes } from "./task-timer-mode";

describe("getEstimatedMinutes", () => {
  it("uses zero minutes for stopwatch tasks", () => {
    expect(getEstimatedMinutes("stopwatch", "")).toBe(0);
  });

  it("converts a countdown duration from hours and minutes", () => {
    expect(getEstimatedMinutes("countdown", "01:30")).toBe(90);
  });
});
