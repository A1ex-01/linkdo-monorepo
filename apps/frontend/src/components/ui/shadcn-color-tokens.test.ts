import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const uiDirectory = resolve(import.meta.dirname);

describe("shadcn UI color tokens", () => {
  it("does not hard-code colors in shared primitives", () => {
    for (const file of ["popover.tsx", "progress.tsx"]) {
      const source = readFileSync(resolve(uiDirectory, file), "utf8");
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });
});
