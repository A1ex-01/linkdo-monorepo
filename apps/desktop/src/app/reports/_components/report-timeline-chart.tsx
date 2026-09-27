// desktop/src/app/reports/_components/report-timeline-chart.tsx

"use client";

import { toTimelineChartData } from "@/lib/report-view";
import type { ITimelinePoint } from "@/types/base";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
    <section className="border-border bg-card flex h-[440px] flex-col rounded-xl border px-7 pt-6 pb-5">
      <div className="mb-3">
        <h2 className="text-foreground text-base font-bold">
          Activity & focus
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Completed and created tasks alongside focused minutes
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 24, left: 0, bottom: 8 }}
            barCategoryGap="36%"
            barGap={8}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
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
            <YAxis
              yAxisId="tasks"
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="focus"
              orientation="right"
              tickFormatter={(value) => `${value}m`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
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
              yAxisId="tasks"
              dataKey="tasks"
              name="Completed"
              fill="var(--chart-2)"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
            <Bar
              yAxisId="tasks"
              dataKey="newTasks"
              name="Created"
              fill="var(--chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={68}
            />
            <Line
              yAxisId="focus"
              dataKey="total"
              name="Focus minutes"
              fill="var(--chart-5)"
              stroke="var(--chart-5)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--chart-5)" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
