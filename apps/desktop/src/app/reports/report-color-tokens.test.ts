import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const reportsDirectory = resolve(import.meta.dirname);

describe("report color tokens", () => {
  it("uses theme tokens instead of fixed color values", () => {
    for (const file of [
      "page.tsx",
      "_components/report-summary-cards.tsx",
      "_components/report-timeline-chart.tsx",
      "_components/report-collection-table.tsx",
    ]) {
      const source = readFileSync(resolve(reportsDirectory, file), "utf8");

      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });
});
