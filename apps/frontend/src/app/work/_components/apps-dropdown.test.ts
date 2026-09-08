import { describe, expect, it } from "vitest";

import { COMING_SOON_INTEGRATIONS } from "./coming-soon-integrations";

describe("AppsDropdown", () => {
  it("lists Figma Comments as an upcoming integration", () => {
    expect(COMING_SOON_INTEGRATIONS).toContainEqual(
      expect.objectContaining({
        name: "Figma Comments",
        description: "Turn design feedback into tasks",
      }),
    );
  });
});
