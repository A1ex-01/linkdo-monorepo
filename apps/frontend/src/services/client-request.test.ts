import { beforeEach, describe, expect, it } from "vitest";

import { getToken } from "./client-request";

describe("getToken", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null once the stored session token has been removed", () => {
    expect(getToken()).toBeNull();
  });
});
