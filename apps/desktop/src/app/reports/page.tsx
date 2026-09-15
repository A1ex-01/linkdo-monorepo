// desktop/src/app/reports/page.tsx

"use client";

import {
  IconArrowRight,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconDots,
  IconDownload,
  IconGridDots,
  IconPlus,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ReportSummaryCards } from "@/app/reports/_components/report-summary-cards";
import { ReportTimelineChart } from "@/app/reports/_components/report-timeline-chart";
import BottomNav from "@/components/bottom-nav";
import { AIconClickup, AIconNotion } from "@/components/icons/base";
import { Button } from "@linkdo/ui/components/button";
import { Calendar } from "@linkdo/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@linkdo/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@linkdo/ui/components/select";
import { WindowTitleBar } from "@/components/window-title-bar";
import {
  formatReportDate,
  formatReportDateShort,
  formatReportMinutes,
  formatReportTime,
  getSessionStats,
  groupReportSessionsByDate,
} from "@/lib/report-view";
import { cn } from "@/lib/utils";
import { getCollections } from "@/services/collection";
import {
  getReportSessions,
  getReportSummary,
  getReportTimeline,
} from "@/services/report";
import type {
  ICollection,
  IReportQuery,
  IReportSession,
  IReportSummary,
  ITimelinePoint,
} from "@/types/base";

type DatePreset = "7d" | "30d" | "90d" | "custom";
type ReportTab = "overview" | "sessions";

function presetToRange(
  preset: DatePreset,
  customStart?: Date,
  customEnd?: Date,
): { start?: string; end?: string } {
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
  const [tab, setTab] = useState<ReportTab>("overview");
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [selectedCollectionUUIDs, setSelectedCollectionUUIDs] = useState<
    string[]
  >([]);

  const query: IReportQuery = useMemo(() => {
    const { start, end } = presetToRange(datePreset, customStart, customEnd);
    return {
      start_date: start,
      end_date: end,
      collection_uuids:
        selectedCollectionUUIDs.length > 0
          ? selectedCollectionUUIDs
          : undefined,
    };
  }, [datePreset, customStart, customEnd, selectedCollectionUUIDs]);

  const { data: collections = [] } = useRequest(async () => {
    const res = await getCollections();
    return res.data ?? [];
  });

  const { data: summary, loading: summaryLoading } = useRequest(
    async () => {
      const res = await getReportSummary(query);
      if (!res.success) throw new Error(res.error ?? "Failed to load summary");
      return res.data;
    },
    { refreshDeps: [query] },
  );

  const { data: timeline, loading: timelineLoading } = useRequest(
    async () => {
      const res = await getReportTimeline(query);
      if (!res.success) throw new Error(res.error ?? "Failed to load timeline");
      return res.data ?? [];
    },
    { refreshDeps: [query] },
  );

  const { data: sessions = [], loading: sessionsLoading } = useRequest(
    async () => {
      const res = await getReportSessions(query);
      if (!res.success) throw new Error(res.error ?? "Failed to load sessions");
      return res.data ?? [];
    },
    { refreshDeps: [query] },
  );

  const selectedCollection =
    selectedCollectionUUIDs.length === 1
      ? collections.find((collection) =>
          selectedCollectionUUIDs.includes(collection.uuid),
        )
      : undefined;

  const { start, end } = presetToRange(datePreset, customStart, customEnd);
  const sessionStats = getSessionStats(sessions);
  const sessionGroups = groupReportSessionsByDate(sessions);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f0f0f] text-white">
      <WindowTitleBar />
      <main className="min-h-0 flex-1 overflow-y-auto px-8 pt-8 pb-24">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="flex items-center gap-1 bg-transparent text-sm font-bold text-[#6f6f72] transition-colors hover:text-white"
            >
              <IconChevronLeft className="size-4" />
              BACK
            </button>
            <h1 className="text-[28px] font-bold tracking-normal text-[#f4f4f5]">
              Reports
            </h1>
          </div>
          <HeaderTools />
        </div>

        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="flex flex-col gap-7">
            <SegmentedTabs value={tab} onChange={setTab} />
            <CollectionFilter
              collections={collections}
              selected={selectedCollectionUUIDs}
              onChange={setSelectedCollectionUUIDs}
            />
          </div>
          <div className="flex flex-col items-end gap-5">
            <ActionBar tab={tab} />
            <DateRangeControl
              preset={datePreset}
              start={customStart}
              end={customEnd}
              rangeStart={start}
              rangeEnd={end}
              onPresetChange={setDatePreset}
              onStartChange={setCustomStart}
              onEndChange={setCustomEnd}
            />
          </div>
        </div>

        {tab === "overview" ? (
          <OverviewTab
            summary={summary}
            timeline={timeline}
            loading={summaryLoading || timelineLoading}
          />
        ) : (
          <SessionsTab
            loading={sessionsLoading}
            sessions={sessions}
            groups={sessionGroups}
            stats={sessionStats}
            selectedCollection={selectedCollection}
          />
        )}
      </main>
      <BottomNav active="reports" />
    </div>
  );
}

function HeaderTools() {
  return (
    <div className="flex items-center gap-5 rounded-lg bg-[#171717] px-5 py-4 text-[#9a9a9d]">
      <IconSearch className="size-6" stroke={2} />
      <IconGridDots className="size-6" stroke={2} />
      <IconSettings className="size-6" stroke={2} />
      <div className="flex size-9 items-center justify-center rounded-full bg-[#303033] text-sm font-semibold text-[#dedee1]">
        a
      </div>
      <IconChevronDown className="size-5" stroke={2} />
    </div>
  );
}

function SegmentedTabs({
  value,
  onChange,
}: {
  value: ReportTab;
  onChange: (value: ReportTab) => void;
}) {
  return (
    <div className="flex h-14 w-[386px] items-center rounded-2xl border border-[#262629] bg-[#121212] p-1">
      {(["overview", "sessions"] as ReportTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-transparent text-lg font-semibold text-[#f1f1f3] transition-colors",
            value === tab && "bg-[#28282b]",
          )}
        >
          {tab === "overview" ? "Overview" : "Sessions"}
          {tab === "sessions" ? (
            <span className="rounded-full bg-[#3a3a3c] px-3 py-1 text-[12px] font-bold text-[#cfcfd1]">
              Beta
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function ActionBar({ tab }: { tab: ReportTab }) {
  if (tab === "overview") {
    return (
      <Button
        variant="outline"
        className="h-12 rounded-full border-[#8a4fd7] bg-transparent px-6 text-base font-bold text-[#a2a2a8] hover:bg-[#1a151f] hover:text-white"
      >
        <IconDownload className="size-5" />
        Export PDF
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <Button className="h-12 rounded-full bg-[#242426] px-6 text-base font-bold text-white hover:bg-[#303033]">
        <IconPlus className="size-5" />
        Add Session
      </Button>
      <Button
        variant="outline"
        className="h-12 rounded-full border-[#8a4fd7] bg-transparent px-6 text-base font-bold text-white hover:bg-[#1a151f]"
      >
        <IconDownload className="size-5" />
        Export .csv
      </Button>
    </div>
  );
}

function OverviewTab({
  summary,
  timeline,
  loading,
}: {
  summary?: IReportSummary;
  timeline?: ITimelinePoint[];
  loading: boolean;
}) {
  if (loading && !summary && !timeline) {
    return <SkeletonBlock className="h-[620px]" />;
  }

  return (
    <div className="space-y-8">
      <ReportSummaryCards summary={summary} />
      <ReportTimelineChart data={timeline} />
    </div>
  );
}

function SessionsTab({
  loading,
  sessions,
  groups,
  stats,
  selectedCollection,
}: {
  loading: boolean;
  sessions: IReportSession[];
  groups: { date: string; sessions: IReportSession[] }[];
  stats: { totalMinutes: number; totalTasks: number; totalSessions: number };
  selectedCollection?: ICollection;
}) {
  if (loading && sessions.length === 0) {
    return <SkeletonBlock className="h-[420px]" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-8">
        <MetricCard
          title="Total Time"
          value={formatReportMinutes(stats.totalMinutes)}
        />
        <MetricCard title="Total Tasks" value={String(stats.totalTasks)} />
        <MetricCard
          title="Total Sessions"
          value={String(stats.totalSessions)}
        />
      </div>
      <div className="space-y-8">
        {groups.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[#2b2b2d] bg-[#171717] text-sm text-[#7d7d82]">
            No sessions in this window.
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.date} className="space-y-4">
              <div className="flex items-center gap-5">
                <span className="text-base font-semibold text-[#78787d]">
                  {group.date}
                </span>
                <div className="h-px flex-1 bg-[#242426]" />
              </div>
              <div className="space-y-3">
                {group.sessions.map((session, index) => (
                  <SessionRow
                    key={session.uuid}
                    session={session}
                    index={index}
                    selectedCollection={selectedCollection}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="h-[124px] rounded-lg border border-[#29292c] bg-[#171717] px-6 py-5">
      <div className="text-lg font-semibold text-[#67676c]">{title}</div>
      <div className="mt-4 text-[32px] leading-none font-bold text-[#f4f4f5]">
        {value}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  index,
  selectedCollection,
}: {
  session: IReportSession;
  index: number;
  selectedCollection?: ICollection;
}) {
  return (
    <div
      className={cn(
        "grid min-h-[74px] grid-cols-[minmax(320px,1fr)_120px_120px_130px_44px_110px_36px] items-center gap-5 rounded-lg bg-[#171717] px-6 text-[15px] text-[#78787d]",
        index > 0 && "border border-[#29292c]",
      )}
    >
      <div className="flex min-w-0 items-center gap-6">
        <span className="truncate text-lg font-bold text-[#f3f3f4]">
          {session.task_title}
        </span>
        <span className="text-[#57575b]">•</span>
        <CollectionChip
          name={selectedCollection?.name ?? session.collection_name}
          icon={selectedCollection?.icon ?? session.collection_icon}
        />
      </div>
      <span className="justify-self-end">
        Session {String(index + 1).padStart(2, "0")}
      </span>
      <span className="flex items-center gap-3">
        <IconCalendar className="size-5" />
        {formatReportDateShort(session.started_at)}
      </span>
      <span>{formatReportTime(session.started_at)}</span>
      <IconArrowRight className="size-5 justify-self-center text-[#87878b]" />
      <span>{formatReportTime(session.ended_at)}</span>
      <div className="flex items-center justify-end gap-8">
        <span className="text-lg font-bold text-[#f3f3f4]">
          {formatReportMinutes(Math.round((session.duration ?? 0) / 60))}
        </span>
        <IconDots className="size-5 text-[#ededee]" />
      </div>
    </div>
  );
}

function CollectionChip({ name, icon }: { name: string; icon?: string }) {
  const normalizedIcon = icon?.trim();

  return (
    <span className="flex min-w-0 items-center gap-2 rounded-md bg-[#272729] px-3 py-1 text-base font-semibold text-[#d8d8db]">
      <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded bg-[#4f79e8] text-xs font-bold text-white">
        {normalizedIcon ? normalizedIcon.slice(0, 1) : name.slice(0, 1)}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

function CollectionFilter({
  collections,
  selected,
  onChange,
}: {
  collections: ICollection[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const value = selected.length === 1 ? selected[0] : "all";

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === "all" ? [] : [next])}
    >
      <SelectTrigger className="h-16 w-[340px] border-0 bg-[#171717] px-7 text-lg font-semibold text-[#f0f0f2]">
        <SelectValue placeholder="All Lists" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center gap-3">
            <SourceIcons />
            All Lists
          </span>
        </SelectItem>
        {collections.map((collection) => (
          <SelectItem key={collection.uuid} value={collection.uuid}>
            {collection.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SourceIcons() {
  return (
    <span className="flex items-center -space-x-2">
      <AIconClickup className="size-5 border border-white/10" />
      <AIconNotion className="size-5 border border-white/10" />
      <span className="flex size-5 items-center justify-center rounded-sm bg-[#5d82ea] text-[11px] font-bold text-white">
        日
      </span>
    </span>
  );
}

function DateRangeControl({
  preset,
  start,
  end,
  rangeStart,
  rangeEnd,
  onPresetChange,
  onStartChange,
  onEndChange,
}: {
  preset: DatePreset;
  start?: Date;
  end?: Date;
  rangeStart?: string;
  rangeEnd?: string;
  onPresetChange: (value: DatePreset) => void;
  onStartChange: (value: Date | undefined) => void;
  onEndChange: (value: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <Select
        value={preset}
        onValueChange={(value) => onPresetChange(value as DatePreset)}
      >
        <SelectTrigger className="h-14 w-40 border-0 bg-[#171717] text-base text-[#d8d8db]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {preset === "custom" ? (
        <>
          <DatePopover value={start} onChange={onStartChange} />
          <DatePopover value={end} onChange={onEndChange} />
        </>
      ) : null}
      <div className="flex h-16 min-w-[420px] items-center gap-5 rounded-lg bg-[#171717] px-6 text-lg font-medium text-[#f0f0f2]">
        <IconCalendar className="size-6 text-[#8a8a8f]" />
        <span>
          {rangeStart ? formatReportDate(rangeStart) : "Start"} -{" "}
          {rangeEnd ? formatReportDate(rangeEnd) : "End"}
        </span>
      </div>
    </div>
  );
}

function DatePopover({
  value,
  onChange,
}: {
  value?: Date;
  onChange: (value: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-14 rounded-lg bg-[#171717] px-4 text-sm text-[#d8d8db]"
        >
          {value ? format(value, "MMM dd") : "Pick date"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg border border-[#29292c] bg-[#171717]",
        className,
      )}
    />
  );
}
