import { describe, expect, it } from "vitest";

import { toScheduledDateInput, toScheduledDateRequest } from "./scheduled-date";

describe("toScheduledDateRequest", () => {
  it("sends a local datetime without a UTC conversion", () => {
    expect(toScheduledDateRequest("2025-08-05T15:49:32")).toBe(
      "2025-08-05 15:49:32",
    );
  });

  it("keeps the wall-clock value returned with a timezone offset editable", () => {
    expect(toScheduledDateInput("2025-08-05T15:49:32+08:00")).toBe(
      "2025-08-05T15:49:32",
    );
  });
});
