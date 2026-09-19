// desktop/src/app/reports/page.tsx

"use client";

import { ReportSummaryCards } from "@/app/reports/_components/report-summary-cards";
import { ReportTimelineChart } from "@/app/reports/_components/report-timeline-chart";
import BottomNav from "@/components/bottom-nav";
import { AIconClickup, AIconNotion } from "@/components/icons/base";
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
    <div className="bg-background text-foreground flex h-screen flex-col overflow-hidden">
      <WindowTitleBar />
      <main className="min-h-0 flex-1 overflow-y-auto px-8 pt-8 pb-24">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 bg-transparent text-sm font-bold transition-colors"
            >
              <IconChevronLeft className="size-4" />
              BACK
            </button>
            <h1 className="text-foreground text-[28px] font-bold tracking-normal">
              Reports
            </h1>
          </div>
          {/* <HeaderTools /> */}
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
            {/* <ActionBar tab={tab} /> */}
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
    <div className="bg-card text-muted-foreground flex items-center gap-5 rounded-lg px-5 py-4">
      <IconSearch className="size-6" stroke={2} />
      <IconGridDots className="size-6" stroke={2} />
      <IconSettings className="size-6" stroke={2} />
      <div className="bg-muted text-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold">
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
    <div className="border-border bg-card flex h-14 w-[386px] items-center rounded-2xl border p-1">
      {(["overview", "sessions"] as ReportTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "text-foreground flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-transparent text-lg font-semibold transition-colors",
            value === tab && "bg-muted",
          )}
        >
          {tab === "overview" ? "Overview" : "Sessions"}
          {tab === "sessions" ? (
            <span className="bg-muted-foreground/15 text-muted-foreground rounded-full px-3 py-1 text-[12px] font-bold">
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
        className="border-primary/70 text-muted-foreground hover:bg-accent hover:text-foreground h-12 rounded-full bg-transparent px-6 text-base font-bold"
      >
        <IconDownload className="size-5" />
        Export PDF
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-6 text-base font-bold">
        <IconPlus className="size-5" />
        Add Session
      </Button>
      <Button
        variant="outline"
        className="border-primary/70 text-foreground hover:bg-accent h-12 rounded-full bg-transparent px-6 text-base font-bold"
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
          <div className="border-border bg-card text-muted-foreground flex h-56 items-center justify-center rounded-lg border border-dashed text-sm">
            No sessions in this window.
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.date} className="space-y-4">
              <div className="flex items-center gap-5">
                <span className="text-muted-foreground text-base font-semibold">
                  {group.date}
                </span>
                <div className="bg-border h-px flex-1" />
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
    <div className="border-border bg-card h-[124px] rounded-lg border px-6 py-5">
      <div className="text-muted-foreground text-lg font-semibold">{title}</div>
      <div className="text-foreground mt-4 text-[32px] leading-none font-bold">
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
        "bg-card text-muted-foreground grid min-h-[74px] grid-cols-[minmax(320px,1fr)_120px_120px_130px_44px_110px_36px] items-center gap-5 rounded-lg px-6 text-[15px]",
        index > 0 && "border-border border",
      )}
    >
      <div className="flex min-w-0 items-center gap-6">
        <span className="text-foreground truncate text-lg font-bold">
          {session.task_title}
        </span>
        <span className="text-muted-foreground">•</span>
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
      <IconArrowRight className="text-muted-foreground size-5 justify-self-center" />
      <span>{formatReportTime(session.ended_at)}</span>
      <div className="flex items-center justify-end gap-8">
        <span className="text-foreground text-lg font-bold">
          {formatReportMinutes(Math.round((session.duration ?? 0) / 60))}
        </span>
        <IconDots className="text-foreground size-5" />
      </div>
    </div>
  );
}

function CollectionChip({ name, icon }: { name: string; icon?: string }) {
  const normalizedIcon = icon?.trim();

  return (
    <span className="bg-muted text-foreground flex min-w-0 items-center gap-2 rounded-md px-3 py-1 text-base font-semibold">
      <span className="bg-chart-2 text-primary-foreground flex size-5 shrink-0 items-center justify-center overflow-hidden rounded text-xs font-bold">
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
      <SelectTrigger className="bg-card text-foreground h-16 w-[340px] border-0 px-7 text-lg font-semibold">
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
      <AIconClickup className="border-border size-5 border" />
      <AIconNotion className="border-border size-5 border" />
      <span className="bg-chart-2 text-primary-foreground flex size-5 items-center justify-center rounded-sm text-[11px] font-bold">
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
        <SelectTrigger className="bg-card text-foreground h-14 w-40 border-0 text-base">
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
      <div className="bg-card text-foreground flex h-16 min-w-[420px] items-center gap-5 rounded-lg px-6 text-lg font-medium">
        <IconCalendar className="text-muted-foreground size-6" />
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
          className="bg-card text-foreground h-14 rounded-lg px-4 text-sm"
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
        "border-border bg-card animate-pulse rounded-lg border",
        className,
      )}
    />
  );
}
