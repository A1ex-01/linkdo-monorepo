"use client";

import { formatReportMinutes } from "@/lib/report-view";
import type { IReportTopTask } from "@/types/base";

export function ReportTopTasks({ tasks }: { tasks: IReportTopTask[] }) {
  return (
    <section className="border-border bg-card rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-base font-bold">
            Focus leaderboard
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Tasks with the most recorded focus time
          </p>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-bold">
          TOP 5
        </span>
      </div>
      {tasks.length === 0 ? (
        <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
          No focused tasks in this window.
        </div>
      ) : (
        <ol className="divide-border mt-5 divide-y">
          {tasks.map((task, index) => (
            <li
              key={task.task_uuid}
              className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-3"
            >
              <span className="text-muted-foreground text-sm font-bold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-foreground truncate font-semibold">
                  {task.task_title}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {task.collection_icon || "📋"} {task.collection_name} ·{" "}
                  {task.status.replace("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-foreground text-sm font-bold">
                  {formatReportMinutes(task.actual_minutes)}
                </p>
                <p className="text-muted-foreground text-xs">
                  of {formatReportMinutes(task.estimated_minutes)} planned
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
