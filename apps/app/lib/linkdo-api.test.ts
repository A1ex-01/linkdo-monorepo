import { describe, expect, it, vi } from "vitest";

import { createLinkdoApi } from "./linkdo-api";

describe("Linkdo read-only API", () => {
  it("attaches the bearer token and never exposes a write method", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
    const api = createLinkdoApi({
      baseUrl: "https://api.example.test/",
      fetcher,
      getToken: async () => "token",
    });

    await api.getCollections();

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/collections",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
    expect(api).not.toHaveProperty("createTask");
    expect(api).not.toHaveProperty("updateTask");
    expect(api).not.toHaveProperty("deleteTask");
  });

  it("encodes the requested report range and collection filters", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
    const api = createLinkdoApi({
      baseUrl: "https://api.example.test",
      fetcher,
      getToken: async () => null,
    });

    await api.getReportInsights({
      startDate: "2026-09-01",
      endDate: "2026-09-28",
      collectionUuids: ["a", "b"],
    });

    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "https://api.example.test/api/reports/insights?start_date=2026-09-01&end_date=2026-09-28&collection_uuids=a&collection_uuids=b",
    );
  });

  it("exposes the desktop report read models without write operations", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
    const api = createLinkdoApi({
      baseUrl: "https://api.example.test",
      fetcher,
      getToken: async () => null,
    });

    await api.getReportTimeline({ startDate: "2026-09-01" });
    await api.getReportBreakdown();

    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "https://api.example.test/api/reports/timeline?start_date=2026-09-01",
      "https://api.example.test/api/reports/breakdown",
    ]);
    expect(api).not.toHaveProperty("startTimer");
  });

  it("retains read-only provider, candidate, and active-focus queries", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
    const api = createLinkdoApi({
      baseUrl: "https://api.example.test",
      fetcher,
      getToken: async () => null,
    });

    await api.getCollectionSources("collection-1");
    await api.getRemoteTaskCandidates("notion", "source-1");
    await api.getCurrentTimer();

    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "https://api.example.test/api/collections/collection-1/notion-databases",
      "https://api.example.test/api/collections/collection-1/clickup-lists",
      "https://api.example.test/api/notion-databases/source-1/import-candidates",
      "https://api.example.test/api/timer/current",
    ]);
  });
});
