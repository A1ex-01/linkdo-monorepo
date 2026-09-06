import { describe, expect, it } from "vitest";

import type { IReportSession } from "@/types/base";
import {
  formatReportMinutes,
  getSessionStats,
  groupReportSessionsByDate,
  toTimelineChartData,
} from "./report-view";

const sessions: IReportSession[] = [
  {
    uuid: "session-2",
    task_uuid: "task-2",
    task_title: "Second task",
    collection_uuid: "collection-1",
    collection_name: "Daily",
    collection_icon: "D",
    started_at: "2026-09-06T12:00:00Z",
    ended_at: "2026-09-06T12:03:00Z",
    duration: 180,
  },
  {
    uuid: "session-1",
    task_uuid: "task-1",
    task_title: "First task",
    collection_uuid: "collection-2",
    collection_name: "Work",
    started_at: "2026-09-05T10:00:00Z",
    ended_at: "2026-09-05T10:25:00Z",
    duration: 1500,
  },
];

describe("report view helpers", () => {
  it("formats report minutes compactly", () => {
    expect(formatReportMinutes(0)).toBe("0min");
    expect(formatReportMinutes(31)).toBe("31min");
    expect(formatReportMinutes(83)).toBe("1hr 23min");
  });

  it("summarizes sessions in minutes and task count", () => {
    expect(getSessionStats(sessions)).toEqual({
      totalMinutes: 28,
      totalTasks: 2,
      totalSessions: 2,
    });
  });

  it("groups sessions by newest local date first", () => {
    expect(groupReportSessionsByDate(sessions)).toEqual([
      { date: "Sep 06, 2026", sessions: [sessions[0]] },
      { date: "Sep 05, 2026", sessions: [sessions[1]] },
    ]);
  });

  it("labels created tasks as new tasks instead of breaks", () => {
    const [point] = toTimelineChartData([
      {
        date: "2026-09-06",
        started_count: 4,
        completed_count: 2,
        focus_minutes: 31,
      },
    ]);

    expect(point).toMatchObject({
      tasks: 2,
      newTasks: 4,
      total: 31,
    });
    expect(point).not.toHaveProperty("breaks");
  });
});
