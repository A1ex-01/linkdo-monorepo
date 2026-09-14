import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sharedUiComponents = fileURLToPath(
  new URL("./", import.meta.url),
);

describe("shadcn UI color tokens", () => {
  it("does not hard-code colors in shared primitives", () => {
    for (const file of ["popover.tsx", "progress.tsx"]) {
      const source = readFileSync(`${sharedUiComponents}${file}`, "utf8");
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });
});
