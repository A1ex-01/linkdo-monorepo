"use client";

import type { IReportSegment } from "@/types/base";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_META: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "var(--chart-4)" },
  this_week: { label: "This week", color: "var(--chart-1)" },
  today: { label: "Today", color: "var(--chart-2)" },
  done: { label: "Done", color: "var(--chart-5)" },
};

const SOURCE_META: Record<string, { label: string; color: string }> = {
  local: { label: "Linkdo", color: "var(--chart-2)" },
  notion: { label: "Notion", color: "var(--chart-5)" },
  clickup: { label: "ClickUp", color: "var(--chart-1)" },
};

function DistributionCard({
  title,
  description,
  data,
  meta,
}: {
  title: string;
  description: string;
  data: IReportSegment[];
  meta: Record<string, { label: string; color: string }>;
}) {
  const total = data.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <section className="border-border bg-card min-h-[300px] rounded-xl border p-6">
      <div>
        <h2 className="text-foreground text-base font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      {total === 0 ? (
        <div className="text-muted-foreground flex h-52 items-center justify-center text-sm">
          No tasks in this window.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[150px_1fr] items-center gap-5">
          <div className="relative h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="key"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((segment) => (
                    <Cell
                      key={segment.key}
                      fill={meta[segment.key]?.color ?? "var(--muted)"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, key) => [
                    value,
                    meta[String(key)]?.label ?? key,
                  ]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-foreground text-2xl font-bold">
                {total}
              </span>
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Tasks
              </span>
            </div>
          </div>
          <ul className="space-y-3">
            {data.map((segment) => {
              const item = meta[segment.key] ?? {
                label: segment.key,
                color: "var(--muted)",
              };
              const percentage = Math.round((segment.count / total) * 100);
              return (
                <li
                  key={segment.key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="text-foreground font-semibold">
                    {segment.count} · {percentage}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ReportDistributionCharts({
  statusBreakdown,
  sourceBreakdown,
}: {
  statusBreakdown: IReportSegment[];
  sourceBreakdown: IReportSegment[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <DistributionCard
        title="Task status"
        description="Where work stands right now"
        data={statusBreakdown}
        meta={STATUS_META}
      />
      <DistributionCard
        title="Task sources"
        description="How tasks enter your workspace"
        data={sourceBreakdown}
        meta={SOURCE_META}
      />
    </div>
  );
}
