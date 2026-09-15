import { describe, expect, it } from "vitest";

import { getTaskTimerDisplay } from "./task-timer";

describe("getTaskTimerDisplay", () => {
  it("counts up when a task has no estimate", () => {
    expect(getTaskTimerDisplay(0, 1_205)).toEqual({
      value: "00:20:05",
      isOverdue: false,
    });
  });

  it("counts down while the task remains within its estimate", () => {
    expect(getTaskTimerDisplay(30, 595)).toEqual({
      value: "00:20:05",
      isOverdue: false,
    });
  });

  it("shows a plus sign after exceeding the estimate", () => {
    expect(getTaskTimerDisplay(15, 1_200)).toEqual({
      value: "+ 00:05:00",
      isOverdue: true,
    });
  });
});
