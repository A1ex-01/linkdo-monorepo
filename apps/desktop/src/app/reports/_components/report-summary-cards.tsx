// desktop/src/app/reports/_components/report-summary-cards.tsx

"use client";

import { formatReportMinutes } from "@/lib/report-view";
import { cn } from "@/lib/utils";
import type { IReportSummary } from "@/types/base";

interface ReportSummaryCardsProps {
  summary: IReportSummary | undefined;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const totalWorkDays = summary?.total_work_days ?? 0;
  const completedTasks = summary?.completed_tasks ?? 0;
  const actualMinutes = summary?.actual_time_minutes ?? 0;
  const averageMinutes =
    completedTasks > 0 ? Math.round(actualMinutes / completedTasks) : 0;
  const completionRate = summary?.completion_rate ?? 0;
  const focusSessions = summary?.focus_session_count ?? 0;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <SummaryCard title="Total work days" value={String(totalWorkDays)} />
      <SummaryCard title="Total tasks done" value={String(completedTasks)} />
      <SummaryCard
        title="Completion rate"
        value={`${Math.round(completionRate)}%`}
      />
      <SummaryCard
        title="Total time worked"
        value={formatReportMinutes(actualMinutes)}
      />
      <SummaryCard title="Focus sessions" value={String(focusSessions)} />
      <SummaryCard
        title="Avg. Time per task"
        value={formatReportMinutes(averageMinutes)}
      />
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div
      className={cn(
        "border-border bg-card flex min-h-[124px] flex-col justify-center rounded-xl border px-6 py-5",
      )}
    >
      <div className="text-muted-foreground text-lg font-semibold">{title}</div>
      <div className="text-foreground mt-4 text-[32px] leading-none font-bold tracking-normal">
        {value}
      </div>
    </div>
  );
}
