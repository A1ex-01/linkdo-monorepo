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
import { TaskCard } from "@/components/task-card";
import { type TaskStatus } from "@/lib/linkdo-api";
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";

const statuses: TaskStatus[] = ["backlog", "this_week", "today", "done"];
const labels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  this_week: "This Week",
  today: "Today",
  done: "Done",
};
export default function CollectionPage() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const api = useLinkdoApi();
  const router = useRouter();
  const [collection, setCollection] =
    React.useState<Awaited<ReturnType<typeof api.getCollection>>>();
  const [tasks, setTasks] = React.useState<
    Awaited<ReturnType<typeof api.getTasks>>
  >([]);
  const [tab, setTab] = React.useState<TaskStatus>("today");
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    Promise.all([api.getCollection(uuid), api.getTasks(uuid)])
      .then(([nextCollection, nextTasks]) => {
        setCollection(nextCollection);
        setTasks(nextTasks);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "无法加载工作区"),
      );
  }, [api, uuid]);
  if (error) return <PageError message={error} />;
  if (!collection) return <Loading />;
  const visible = tasks.filter((task) => task.status === tab);
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>
            {collection.icon || "📋"} {collection.name}
          </CardTitle>
          <CardDescription>
            {collection.pending_count} 个待处理；看板、日程和 Focus
            状态均为只读。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/(app)/collections/${uuid}/sources`} asChild>
            <Button variant="outline" size="sm">
              <Text>查看 Sources、映射与远程任务</Text>
            </Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex-row flex-wrap gap-2">
          {statuses.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={tab === status ? "secondary" : "ghost"}
              onPress={() => setTab(status)}
            >
              <Text>
                {labels[status]} ·{" "}
                {tasks.filter((task) => task.status === status).length}
              </Text>
            </Button>
          ))}
        </CardContent>
      </Card>
      {visible.map((task) => (
        <TaskCard
          key={task.uuid}
          task={task}
          onPress={() =>
            router.push(`/(app)/collections/${uuid}/tasks/${task.uuid}`)
          }
        />
      ))}
      {!visible.length ? (
        <Text className="text-sm text-muted-foreground">
          这个状态没有任务。
        </Text>
      ) : null}
    </Page>
  );
}
