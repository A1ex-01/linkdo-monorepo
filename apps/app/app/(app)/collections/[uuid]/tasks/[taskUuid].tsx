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
import { useLocalSearchParams } from "expo-router";
import { ExternalLinkIcon } from "lucide-react-native";
import * as React from "react";
import { Linking, View } from "react-native";

export default function TaskDetailPage() {
  const { uuid, taskUuid } = useLocalSearchParams<{
    uuid: string;
    taskUuid: string;
  }>();
  const api = useLinkdoApi();
  const [task, setTask] =
    React.useState<Awaited<ReturnType<typeof api.getTasks>>[number]>();
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    api
      .getTasks(uuid)
      .then((tasks) => setTask(tasks.find((item) => item.uuid === taskUuid)))
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "无法加载任务"),
      );
  }, [api, taskUuid, uuid]);
  if (error) return <PageError message={error} />;
  if (!task) return <Loading />;
  const source = task.clickup_task_id
    ? "ClickUp"
    : task.notion_page_id
      ? "Notion"
      : undefined;
  const url = task.clickup_task_id
    ? `https://app.clickup.com/t/${task.clickup_task_id}`
    : task.notion_page_id
      ? `https://www.notion.so/${task.notion_page_id.replaceAll("-", "")}`
      : undefined;
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>
            {task.status} · {source || "Linkdo"}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Text className="text-sm leading-6">
            {task.content || "没有任务描述。"}
          </Text>
          <Detail label="计划" value={task.scheduled_date || "未排期"} />
          <Detail
            label="预计 / 已专注"
            value={`${formatMinutes(task.estimated_time)} / ${formatMinutes(task.actual_time)}`}
          />
          <Detail
            label="创建时间"
            value={new Date(task.created_at).toLocaleString()}
          />
          {url ? (
            <Button variant="outline" onPress={() => void Linking.openURL(url)}>
              <ExternalLinkIcon />
              <Text>Open in {source}</Text>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </Page>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
