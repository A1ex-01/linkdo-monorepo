// desktop/src/app/reports/_components/report-timeline-chart.tsx

"use client";

import { toTimelineChartData } from "@/lib/report-view";
import type { ITimelinePoint } from "@/types/base";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface ReportTimelineChartProps {
  data: ITimelinePoint[] | undefined;
}

export function ReportTimelineChart({ data }: ReportTimelineChartProps) {
  const points = data ?? [];

  const chartData = toTimelineChartData(points);

  if (chartData.length === 0) {
    return (
      <div className="border-border bg-muted flex h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
        <div className="text-muted-foreground text-sm">
          No activity in this window yet.
        </div>
        <div className="text-muted-foreground text-xs">
          Pick a wider date range or add tasks to see a chart.
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex h-[596px] flex-col rounded-lg border px-7 pt-8 pb-6">
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
              stroke="var(--border)"
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 15,
                fontWeight: 500,
              }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)", strokeWidth: 2 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--popover-foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Legend
              align="left"
              verticalAlign="bottom"
              wrapperStyle={{
                color: "var(--muted-foreground)",
                fontSize: 14,
                fontWeight: 700,
                paddingTop: 18,
              }}
              iconType="rect"
            />
            <Bar
              dataKey="tasks"
              name="TASKS"
              fill="var(--chart-2)"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
            <Bar
              dataKey="newTasks"
              name="NEW TASKS"
              fill="var(--chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
            <Bar
              dataKey="total"
              name="TOTAL"
              fill="var(--chart-5)"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
