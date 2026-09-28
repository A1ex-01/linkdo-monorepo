import { describe, expect, it } from "vitest";
import { getSelectedSegmentIndex } from "./segmented-tabbar-state";

describe("getSelectedSegmentIndex", () => {
  it("maps the focused route to its visible segment", () => {
    expect(
      getSelectedSegmentIndex(
        ["collections", "search", "settings", "focus", "reports", "mine"],
        4,
      ),
    ).toBe(3);
  });
});
