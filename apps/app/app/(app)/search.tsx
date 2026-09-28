import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Loading, Page } from "@/components/page";
import { TaskCard } from "@/components/task-card";
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import { useRouter } from "expo-router";
import * as React from "react";
export default function SearchPage() {
  const api = useLinkdoApi();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [groups, setGroups] =
    React.useState<
      {
        collectionUuid: string;
        tasks: Awaited<ReturnType<typeof api.getTasks>>;
      }[]
    >();
  React.useEffect(() => {
    api
      .getCollections()
      .then(async (collections) =>
        setGroups(
          await Promise.all(
            collections
              .filter((item) => !item.is_archived)
              .map(async (collection) => ({
                collectionUuid: collection.uuid,
                tasks: await api.getTasks(collection.uuid),
              })),
          ),
        ),
      );
  }, [api]);
  if (!groups) return <Loading />;
  const results = query.trim()
    ? groups.flatMap((group) =>
        group.tasks.filter((task) =>
          task.title.toLowerCase().includes(query.toLowerCase()),
        ),
      )
    : [];
  return (
    <Page>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="搜索所有任务"
        autoFocus
      />
      <Text className="text-sm text-muted-foreground">
        {query ? `${results.length} 个结果` : "输入任务标题开始搜索"}
      </Text>
      {results.map((task) => (
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
    </Page>
  );
}
