// frontend/src/app/reports/_components/report-collection-table.tsx

"use client";

import type { ICollectionBreakdown } from "@/types/base";
import { Progress } from "@/components/ui/progress";

interface ReportCollectionTableProps {
  data: ICollectionBreakdown[] | undefined;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}

export function ReportCollectionTable({ data }: ReportCollectionTableProps) {
  const rows = data ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] bg-[#1d1d1d] p-10 text-center">
        <div className="text-atext-460 text-sm">No collections in scope.</div>
        <div className="text-atext-460 text-xs">
          Adjust the filters above to see per-collection breakdown.
        </div>
      </div>
    );
  }

  return (
    <div className="border-[#2a2a2a] bg-[#1d1d1d] flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-atext-500 text-sm font-semibold">
            Per-collection breakdown
          </div>
          <div className="text-atext-460 text-xs">
            Task status and time tracking per list
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-atext-460 border-b border-[#2a2a2a] text-left text-xs uppercase">
              <th className="px-3 py-2 font-medium">Collection</th>
              <th className="px-3 py-2 text-center font-medium">Total</th>
              <th className="px-3 py-2 text-center font-medium">Done</th>
              <th className="px-3 py-2 text-center font-medium">In progress</th>
              <th className="px-3 py-2 text-center font-medium">Backlog</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 text-right font-medium">Estimated</th>
              <th className="px-3 py-2 text-right font-medium">Actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct =
                row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
              return (
                <tr
                  key={row.collection_uuid}
                  className="border-b border-[#262626] last:border-b-0 hover:bg-[#222]"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">
                        {row.collection_icon || "📋"}
                      </span>
                      <span className="text-atext-500 font-medium">
                        {row.collection_name}
                      </span>
                    </div>
                  </td>
                  <td className="text-atext-500 px-3 py-3 text-center">
                    {row.total}
                  </td>
                  <td className="text-atext-500 px-3 py-3 text-center">
                    {row.completed}
                  </td>
                  <td className="text-atext-500 px-3 py-3 text-center">
                    {row.in_progress}
                  </td>
                  <td className="text-atext-500 px-3 py-3 text-center">
                    {row.backlog}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Progress className="h-1.5" value={pct} />
                      <span className="text-atext-460 w-9 text-right text-xs">
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="text-atext-500 px-3 py-3 text-right">
                    {formatMinutes(row.estimated_minutes)}
                  </td>
                  <td className="text-atext-500 px-3 py-3 text-right">
                    {formatMinutes(row.actual_minutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
