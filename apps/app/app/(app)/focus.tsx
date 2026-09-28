import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Loading, Page } from "@/components/page";
import { TaskCard } from "@/components/task-card";
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import { useRouter } from "expo-router";
import * as React from "react";
export default function FocusPage() {
  const api = useLinkdoApi();
  const router = useRouter();
  const [tasks, setTasks] =
    React.useState<Awaited<ReturnType<typeof api.getTasks>>>();
  React.useEffect(() => {
    api
      .getCollections()
      .then(async (collections) =>
        setTasks(
          (
            await Promise.all(
              collections
                .filter((item) => !item.is_archived)
                .map((item) => api.getTasks(item.uuid)),
            )
          )
            .flat()
            .filter((task) => task.status === "today"),
        ),
      );
  }, [api]);
  if (!tasks) return <Loading />;
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>Focus Capsule</CardTitle>
          <CardDescription>
            桌面端 Sidebar/Capsule 的只读移动视图
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            保留今日队列、任务状态、预计与实际专注时长；不提供开始、停止、切换或完成。
          </Text>
        </CardContent>
      </Card>
      {tasks.map((task) => (
        <TaskCard
          key={task.uuid}
          task={task}
          onPress={() =>
            router.push(
              `/(app)/collections/${task.collection_uuid}/tasks/${task.uuid}`,
            )
          }
        />
      ))}
      {!tasks.length ? (
        <Text className="text-muted-foreground">今天没有任务。</Text>
      ) : null}
    </Page>
  );
}
