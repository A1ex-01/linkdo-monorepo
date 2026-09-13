import { afterEach, describe, expect, it, vi } from "vitest";

import { getTokenExpiration, scheduleTokenExpiration } from "./auth-session";

function createToken(payload: Record<string, unknown>): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `header.${encodedPayload}.signature|user-id|User Name`;
}

describe("token expiration", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the expiration from the JWT portion of a composite session token", () => {
    expect(getTokenExpiration(createToken({ exp: 1_800_000_000 }))).toBe(
      1_800_000_000_000,
    );
  });

  it("ends a session immediately when its token has already expired", () => {
    const onExpired = vi.fn();

    scheduleTokenExpiration(createToken({ exp: 1 }), onExpired);

    expect(onExpired).toHaveBeenCalledOnce();
  });
});
