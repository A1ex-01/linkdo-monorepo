import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = resolve(import.meta.dirname);

describe("workspace color tokens", () => {
  it("does not hard-code colors in workspace components", () => {
    for (const file of readdirSync(componentsDirectory)) {
      if (!file.endsWith(".tsx") || file.endsWith(".test.tsx")) continue;

      const source = readFileSync(resolve(componentsDirectory, file), "utf8");
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });
});
