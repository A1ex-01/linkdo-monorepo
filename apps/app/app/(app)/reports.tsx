import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Loading, Page, PageError } from "@/components/page";
import { formatMinutes } from "@/components/task-card";
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import * as React from "react";
import { View } from "react-native";
export default function ReportsPage() {
  const api = useLinkdoApi();
  const [days, setDays] = React.useState<7 | 30 | 90>(7);
  const [data, setData] =
    React.useState<Awaited<ReturnType<typeof api.getReportInsights>>>();
  const [sessions, setSessions] = React.useState<
    Awaited<ReturnType<typeof api.getReportSessions>>
  >([]);
  const [error, setError] = React.useState<string>();
  const load = React.useCallback(() => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    Promise.all([
      api.getReportInsights({ startDate: start, endDate: end }),
      api.getReportSessions({ startDate: start, endDate: end }),
    ])
      .then(([insights, nextSessions]) => {
        setData(insights);
        setSessions(nextSessions);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "无法加载 Reports"),
      );
  }, [api, days]);
  React.useEffect(() => {
    void load();
  }, [load]);
  if (error) return <PageError message={error} />;
  if (!data) return <Loading />;
  const summary = data.summary;
  return (
    <Page>
      <View className="flex-row gap-2">
        {([7, 30, 90] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={days === value ? "secondary" : "ghost"}
            onPress={() => setDays(value)}
          >
            <Text>{value} 天</Text>
          </Button>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Metric label="完成任务" value={String(summary.completed_tasks)} />
        <Metric
          label="专注时间"
          value={formatMinutes(summary.actual_time_minutes)}
        />
        <Metric
          label="完成率"
          value={`${Math.round(summary.completion_rate)}%`}
        />
        <Metric label="专注会话" value={String(summary.focus_session_count)} />
      </View>
      <DataCard
        title="活动与专注趋势"
        lines={data.timeline.map(
          (point) =>
            `${point.date} · 完成 ${point.completed_count} · 新增 ${point.started_count} · ${formatMinutes(point.focus_minutes)}`,
        )}
      />
      <DataCard
        title="任务状态"
        lines={data.status_breakdown.map(
          (item) => `${item.key}: ${item.count}`,
        )}
      />
      <DataCard
        title="任务来源"
        lines={data.source_breakdown.map(
          (item) => `${item.key}: ${item.count}`,
        )}
      />
      <DataCard
        title="按列表统计"
        lines={data.collection_breakdown.map(
          (item) =>
            `${item.collection_icon || "📋"} ${item.collection_name} · ${item.completed}/${item.total} · ${formatMinutes(item.actual_minutes)}`,
        )}
      />
      <DataCard
        title="投入最多的任务"
        lines={data.top_tasks.map(
          (item) =>
            `${item.task_title} · ${item.collection_name} · ${formatMinutes(item.actual_minutes)}`,
        )}
      />
      <DataCard
        title="专注会话"
        lines={sessions.map(
          (item) =>
            `${item.task_title} · ${item.collection_name} · ${formatMinutes(item.duration)}`,
        )}
      />
    </Page>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="w-[47%]">
      <CardContent className="py-0">
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="text-xl font-semibold">{value}</Text>
      </CardContent>
    </Card>
  );
}
function DataCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        {lines.length ? (
          lines.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              className="text-sm text-muted-foreground"
            >
              {line}
            </Text>
          ))
        ) : (
          <Text className="text-sm text-muted-foreground">暂无数据</Text>
        )}
      </CardContent>
    </Card>
  );
}
