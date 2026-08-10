// frontend/src/app/reports/_components/report-summary-cards.tsx

"use client";

import { cn } from "@/lib/utils";
import type { IReportSummary } from "@/types/base";
import {
  IconBolt,
  IconCalendarStats,
  IconCircleCheck,
} from "@tabler/icons-react";

interface ReportSummaryCardsProps {
  summary: IReportSummary | undefined;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const totalWorkDays = summary?.total_work_days ?? 0;
  const completedTasks = summary?.completed_tasks ?? 0;
  const actualMinutes = summary?.actual_time_minutes ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SummaryCard
        title="Total work days"
        value={String(totalWorkDays)}
        sub={totalWorkDays === 1 ? "day with activity" : "days with activity"}
        icon={<IconCalendarStats className="size-5 text-[#7ba4e8]" />}
      />
      <SummaryCard
        title="Completed tasks"
        value={String(completedTasks)}
        sub="tasks marked done"
        icon={<IconCircleCheck className="size-5 text-[#7ba4e8]" />}
      />
      <SummaryCard
        title="Focus time"
        value={formatMinutes(actualMinutes)}
        sub="tracked via timers"
        icon={<IconBolt className="size-5 text-[#7ba4e8]" />}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-[#2a2a2a] bg-[#1d1d1d] flex flex-col gap-2 rounded-xl border p-5 shadow-sm",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-atext-460 text-xs font-medium tracking-wide uppercase">
          {title}
        </span>
        <span className="bg-primary-400/10 flex size-8 items-center justify-center rounded-md">
          {icon}
        </span>
      </div>
      <div className="text-atext-500 text-3xl font-bold tracking-tight">
        {value}
      </div>
      <div className="text-atext-460 text-xs">{sub}</div>
    </div>
  );
}
