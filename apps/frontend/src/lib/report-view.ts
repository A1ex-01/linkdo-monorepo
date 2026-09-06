import type { IReportSession, ITimelinePoint } from "@/types/base";

export interface ITimelineChartDatum extends ITimelinePoint {
  label: string;
  tasks: number;
  newTasks: number;
  total: number;
}

export function toTimelineChartData(
  points: ITimelinePoint[],
): ITimelineChartDatum[] {
  return points.map((point) => {
    const date = new Date(point.date);
    const label = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      weekday: "short",
    });

    return {
      ...point,
      tasks: point.completed_count,
      newTasks: point.started_count,
      total: point.focus_minutes,
      label,
    };
  });
}

export function formatReportMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}

export function getSessionStats(sessions: IReportSession[]) {
  const totalSeconds = sessions.reduce(
    (sum, session) => sum + Math.max(0, session.duration ?? 0),
    0,
  );
  const taskUUIDs = new Set(sessions.map((session) => session.task_uuid));

  return {
    totalMinutes: Math.round(totalSeconds / 60),
    totalTasks: taskUUIDs.size,
    totalSessions: sessions.length,
  };
}

export function groupReportSessionsByDate(sessions: IReportSession[]) {
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
  const groups: { date: string; sessions: IReportSession[] }[] = [];

  for (const session of sorted) {
    const date = formatReportDate(session.started_at);
    const existing = groups.find((group) => group.date === date);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.push({ date, sessions: [session] });
    }
  }

  return groups;
}

export function formatReportDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatReportDateShort(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
}

export function formatReportTime(value?: string): string {
  if (!value) return "Now";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
