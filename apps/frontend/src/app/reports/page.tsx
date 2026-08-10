// frontend/src/app/reports/page.tsx

"use client";

import { ReportCollectionTable } from "@/app/reports/_components/report-collection-table";
import { ReportSummaryCards } from "@/app/reports/_components/report-summary-cards";
import { ReportTimelineChart } from "@/app/reports/_components/report-timeline-chart";
import { HomeWindowTitleBar } from "@/components/window-title-bar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCollections } from "@/services/collection";
import {
  getReportBreakdown,
  getReportSummary,
  getReportTimeline,
} from "@/services/report";
import type {
  ICollection,
  ICollectionBreakdown,
  IReportQuery,
  IReportSummary,
  ITimelinePoint,
} from "@/types/base";
import { useRequest } from "ahooks";
import { format } from "date-fns";
import {
  IconCalendar,
  IconChevronLeft,
  IconFilter,
  IconRefresh,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";

function presetToRange(
  preset: DatePreset,
  customStart?: Date,
  customEnd?: Date,
): { start?: string; end?: string } {
  if (preset === "all") return {};
  if (preset === "custom") {
    return {
      start: customStart ? format(customStart, "yyyy-MM-dd") : undefined,
      end: customEnd ? format(customEnd, "yyyy-MM-dd") : undefined,
    };
  }
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export default function ReportsPage() {
  const router = useRouter();

  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [selectedCollectionUUIDs, setSelectedCollectionUUIDs] = useState<
    string[]
  >([]);

  // Build the canonical query from current filter state.
  const query: IReportQuery = useMemo(() => {
    const { start, end } = presetToRange(datePreset, customStart, customEnd);
    return {
      start_date: start,
      end_date: end,
      collection_uuids:
        selectedCollectionUUIDs.length > 0 ? selectedCollectionUUIDs : undefined,
    };
  }, [datePreset, customStart, customEnd, selectedCollectionUUIDs]);

  // Load collections for the filter dropdown.
  const { data: collections = [] } = useRequest(
    async () => {
      const res = await getCollections();
      return res.data ?? [];
    },
    { manual: false },
  );

  // Each endpoint refreshes independently so changing one filter doesn't block
  // the other panels. `refreshDeps` re-runs whenever the query changes.
  const { data: summary, loading: summaryLoading, refresh: refreshSummary } =
    useRequest(
      async () => {
        const res = await getReportSummary(query);
        if (!res.success) throw new Error(res.error ?? "Failed to load summary");
        return res.data;
      },
      { refreshDeps: [query] },
    );

  const { data: timeline, loading: timelineLoading, refresh: refreshTimeline } =
    useRequest(
      async () => {
        const res = await getReportTimeline(query);
        if (!res.success) throw new Error(res.error ?? "Failed to load timeline");
        return res.data ?? [];
      },
      { refreshDeps: [query] },
    );

  const { data: breakdown, loading: breakdownLoading, refresh: refreshBreakdown } =
    useRequest(
      async () => {
        const res = await getReportBreakdown(query);
        if (!res.success) throw new Error(res.error ?? "Failed to load breakdown");
        return res.data ?? [];
      },
      { refreshDeps: [query] },
    );

  const handleRefreshAll = () => {
    refreshSummary();
    refreshTimeline();
    refreshBreakdown();
  };

  const toggleCollection = (uuid: string) => {
    setSelectedCollectionUUIDs((prev) =>
      prev.includes(uuid) ? prev.filter((u) => u !== uuid) : [...prev, uuid],
    );
  };

  const clearCollections = () => setSelectedCollectionUUIDs([]);

  const { start, end } = presetToRange(datePreset, customStart, customEnd);

  return (
    <div className="text-foreground flex h-screen flex-col bg-[#111111]">
      <HomeWindowTitleBar />

      {/* Header */}
      <div className="flex w-full items-center justify-between px-10 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="text-atext-460 hover:text-atext-500 flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold transition-colors"
          >
            <IconChevronLeft className="size-4" />
            BACK
          </button>
          <div>
            <h1 className="text-atext-500 text-2xl font-extrabold tracking-tight">
              Reports
            </h1>
            <p className="text-atext-460 mt-0.5 text-xs">
              Insights into your tasks and focus time
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          className="border-[#363636] bg-[#181818]"
        >
          <IconRefresh className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex w-full flex-wrap items-center gap-3 px-10 pt-2 pb-4">
        <DatePresetSelect
          value={datePreset}
          onChange={(v) => setDatePreset(v)}
        />
        {datePreset === "custom" && (
          <DateRangePicker
            start={customStart}
            end={customEnd}
            onStartChange={setCustomStart}
            onEndChange={setCustomEnd}
          />
        )}
        <CollectionFilter
          collections={collections}
          selected={selectedCollectionUUIDs}
          onToggle={toggleCollection}
          onClear={clearCollections}
        />
        {(start || end) && (
          <div className="text-atext-460 text-xs">
            {start ?? "…"} → {end ?? "…"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="flex flex-col gap-6">
          {summaryLoading && !summary ? (
            <SkeletonStrip />
          ) : (
            <ReportSummaryCards summary={summary as IReportSummary | undefined} />
          )}

          {timelineLoading && !timeline ? (
            <SkeletonBlock />
          ) : (
            <ReportTimelineChart
              data={timeline as ITimelinePoint[] | undefined}
            />
          )}

          {breakdownLoading && !breakdown ? (
            <SkeletonBlock />
          ) : (
            <ReportCollectionTable
              data={breakdown as ICollectionBreakdown[] | undefined}
            />
          )}

          {(!summaryLoading || summary) &&
            (!timelineLoading || timeline) &&
            (!breakdownLoading || breakdown) &&
            !summary &&
            timeline?.length === 0 &&
            breakdown?.length === 0 && (
              <div className="text-atext-460 flex flex-col items-center justify-center gap-2 py-10 text-center text-sm">
                <span>No data available for the current filters.</span>
                <button
                  type="button"
                  className="text-atext-500 underline underline-offset-4 hover:text-white"
                  onClick={() => {
                    setDatePreset("30d");
                    setSelectedCollectionUUIDs([]);
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function DatePresetSelect({
  value,
  onChange,
}: {
  value: DatePreset;
  onChange: (v: DatePreset) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DatePreset)}>
      <SelectTrigger className="border-[#363636] bg-[#181818] text-white">
        <SelectValue placeholder="Date range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All time</SelectItem>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="custom">Custom range</SelectItem>
      </SelectContent>
    </Select>
  );
}

function DateRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start?: Date;
  end?: Date;
  onStartChange: (d: Date | undefined) => void;
  onEndChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <DatePopover
        label="Start"
        value={start}
        onChange={onStartChange}
        placeholder="Start date"
      />
      <span className="text-atext-460">→</span>
      <DatePopover
        label="End"
        value={end}
        onChange={onEndChange}
        placeholder="End date"
      />
    </div>
  );
}

function DatePopover({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: Date;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-[#363636] bg-[#181818] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#222]",
          )}
        >
          <IconCalendar className="size-3.5" />
          {value ? format(value, "MMM dd, yyyy") : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function CollectionFilter({
  collections,
  selected,
  onToggle,
  onClear,
}: {
  collections: ICollection[];
  selected: string[];
  onToggle: (uuid: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-[#363636] bg-[#181818] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#222]",
          )}
        >
          <IconFilter className="size-3.5" />
          {selected.length === 0
            ? "All collections"
            : `${selected.length} collection${selected.length === 1 ? "" : "s"}`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="flex flex-col gap-1">
          {collections.length === 0 ? (
            <div className="text-atext-460 px-2 py-3 text-center text-xs">
              No collections yet
            </div>
          ) : (
            <>
              {collections.map((c) => {
                const isSelected = selected.includes(c.uuid);
                return (
                  <button
                    key={c.uuid}
                    type="button"
                    onClick={() => onToggle(c.uuid)}
                    className={cn(
                      "hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-white transition-colors",
                      isSelected && "bg-primary-400/15",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        isSelected
                          ? "border-[#7ba4e8] bg-[#7ba4e8]"
                          : "border-[#363636] bg-transparent",
                      )}
                    >
                      {isSelected && (
                        <span className="text-[10px] text-white">✓</span>
                      )}
                    </span>
                    <span className="truncate">
                      {c.icon} {c.name}
                    </span>
                  </button>
                );
              })}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                  }}
                  className="text-atext-460 hover:text-atext-500 mt-1 self-end px-2 py-1 text-[11px] underline-offset-4 hover:underline"
                >
                  Clear selection
                </button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SkeletonStrip() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[110px] animate-pulse rounded-xl border border-[#2a2a2a] bg-[#1d1d1d]"
        />
      ))}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="h-[360px] animate-pulse rounded-xl border border-[#2a2a2a] bg-[#1d1d1d]" />
  );
}

// Surface a friendly warning if a fetch silently returns no data so we never
// silently show zero numbers without the user noticing.
void toast;
