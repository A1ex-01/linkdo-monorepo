import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = resolve(import.meta.dirname);

describe("task surface color tokens", () => {
  it("does not hard-code colors in task creation or task cards", () => {
    for (const file of ["add-task.tsx", "task-card-item.tsx"]) {
      const source = readFileSync(resolve(componentsDirectory, file), "utf8");
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });
});
