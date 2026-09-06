// frontend/src/app/reports/_components/report-timeline-chart.tsx

"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { ITimelinePoint } from "@/types/base";

interface ReportTimelineChartProps {
  data: ITimelinePoint[] | undefined;
}

export function ReportTimelineChart({ data }: ReportTimelineChartProps) {
  const points = data ?? [];

  // Format date as "Aug 10" for x-axis labels.
  const chartData = points.map((p) => {
    const d = new Date(p.date);
    const label = d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      weekday: "short",
    });
    return {
      ...p,
      tasks: p.completed_count,
      breaks: p.started_count,
      total: p.focus_minutes,
      label,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] bg-[#1d1d1d] p-6 text-center">
        <div className="text-sm text-[#77777c]">
          No activity in this window yet.
        </div>
        <div className="text-xs text-[#5f5f64]">
          Pick a wider date range or add tasks to see a chart.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[596px] flex-col rounded-lg border border-[#29292c] bg-[#171717] px-7 pt-8 pb-6">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 72, left: 40, bottom: 24 }}
            barCategoryGap="36%"
            barGap={8}
          >
            <XAxis
              dataKey="label"
              stroke="#d8d8db"
              tick={{ fill: "#d8d8db", fontSize: 15, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "#c9c9cc", strokeWidth: 2 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#181818",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 13,
                color: "#fff",
              }}
              labelStyle={{ color: "#a3a3a3" }}
            />
            <Legend
              align="left"
              verticalAlign="bottom"
              wrapperStyle={{
                color: "#85858a",
                fontSize: 14,
                fontWeight: 700,
                paddingTop: 18,
              }}
              iconType="rect"
            />
            <Bar
              dataKey="tasks"
              name="TASKS"
              fill="#6550e8"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
            <Bar
              dataKey="breaks"
              name="BREAKS"
              fill="#91d9cf"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
            <Bar
              dataKey="total"
              name="TOTAL"
              fill="#dfb979"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
