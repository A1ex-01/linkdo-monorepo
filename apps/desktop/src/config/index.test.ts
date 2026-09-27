import { describe, expect, it } from "vitest";

describe("AGENT_URL", () => {
  it("uses the IPv4 loopback address for the local agent fallback", async () => {
    const config = await import("./index");

    expect(config.AGENT_URL).toBe("http://127.0.0.1:6001");
  });
});
