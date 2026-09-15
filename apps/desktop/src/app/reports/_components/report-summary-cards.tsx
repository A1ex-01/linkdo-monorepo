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

  return (
    <div className="grid grid-cols-4 gap-8">
      <SummaryCard title="Total work days" value={String(totalWorkDays)} />
      <SummaryCard title="Total tasks done" value={String(completedTasks)} />
      <SummaryCard
        title="Total time worked"
        value={formatReportMinutes(actualMinutes)}
      />
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
        "flex h-[124px] flex-col justify-center rounded-lg border border-[#29292c] bg-[#171717] px-6 py-5",
      )}
    >
      <div className="text-lg font-semibold text-[#67676c]">{title}</div>
      <div className="mt-4 text-[32px] leading-none font-bold tracking-normal text-[#f4f4f5]">
        {value}
      </div>
    </div>
  );
}
