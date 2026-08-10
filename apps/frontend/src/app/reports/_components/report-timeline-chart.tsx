// frontend/src/app/reports/_components/report-timeline-chart.tsx

"use client";

import type { ITimelinePoint } from "@/types/base";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

  // Format date as "Aug 10" for x-axis labels.
  const chartData = points.map((p) => {
    const d = new Date(p.date);
    const label = `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
    return {
      ...p,
      label,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] bg-[#1d1d1d] p-6 text-center">
        <div className="text-atext-460 text-sm">
          No activity in this window yet.
        </div>
        <div className="text-atext-460 text-xs">
          Pick a wider date range or add tasks to see a chart.
        </div>
      </div>
    );
  }

  return (
    <div className="border-[#2a2a2a] bg-[#1d1d1d] flex h-[360px] flex-col gap-2 rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-atext-500 text-sm font-semibold">
            Started vs Completed
          </div>
          <div className="text-atext-460 text-xs">
            Daily task activity within the selected window
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="#808080"
              tick={{ fill: "#808080", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#2a2a2a" }}
            />
            <YAxis
              stroke="#808080"
              tick={{ fill: "#808080", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#2a2a2a" }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#181818",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "#a3a3a3" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }}
              iconType="circle"
            />
            <Bar
              dataKey="started_count"
              name="Started"
              fill="#7ba4e8"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="completed_count"
              name="Completed"
              fill="#9b8cff"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
