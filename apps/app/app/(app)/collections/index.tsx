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
import type { Task } from "@/lib/linkdo-api";
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, View } from "react-native";

export default function CollectionsPage() {
  const api = useLinkdoApi();
  const router = useRouter();
  const [data, setData] = React.useState<
    Awaited<ReturnType<typeof api.getCollections>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [previews, setPreviews] = React.useState<Record<string, Task[]>>({});
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const collections = (await api.getCollections()).filter(
        (item) => !item.is_archived,
      );
      setData(collections);
      const taskPreviews = await Promise.all(
        collections.map(async (collection) => {
          try {
            const tasks = await api.getTasks(collection.uuid);
            return [
              collection.uuid,
              tasks.filter((task) => task.status !== "done").slice(0, 2),
            ] as const;
          } catch {
            return [collection.uuid, []] as const;
          }
        }),
      );
      setPreviews(Object.fromEntries(taskPreviews));
      setError(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "无法加载 Collections",
      );
    } finally {
      setLoading(false);
    }
  }, [api]);
  React.useEffect(() => {
    void load();
  }, [load]);
  if (loading && !data.length) return <Loading />;
  if (error) return <PageError message={error} />;
  return (
    <Page refreshing={loading} onRefresh={() => void load()}>
      <View className="mb-1 gap-1 px-1">
        <Text className="text-lg font-semibold tracking-tight">
          已连接的任务空间
        </Text>
        <Text className="text-sm text-muted-foreground">
          {data.length} 个 Collection · 只读浏览
        </Text>
      </View>
      {data.map((collection) => (
        <Pressable
          key={collection.uuid}
          onPress={() => router.push(`/(app)/collections/${collection.uuid}`)}
        >
          <Card className="gap-0 overflow-hidden rounded-[26px] py-0 shadow-sm shadow-black/10">
            <CardHeader className="flex-row items-center gap-3 px-4 pb-3 pt-4">
              <View className="size-12 items-center justify-center rounded-2xl bg-secondary">
                <Text className="text-[22px]">{collection.icon || "📋"}</Text>
              </View>
              <View className="flex-1">
                <CardTitle className="text-[17px]">{collection.name}</CardTitle>
                <CardDescription className="mt-1">
                  {collection.pending_count} 个待处理 · 预计{" "}
                  {formatMinutes(collection.estimated_total)}
                </CardDescription>
              </View>
              <Text className="text-xl text-muted-foreground">›</Text>
            </CardHeader>
            <CardContent className="gap-2 border-t border-border/70 px-4 py-3">
              {previews[collection.uuid]?.length ? (
                previews[collection.uuid].map((task, index) => (
                  <View
                    className="flex-row items-center gap-2 rounded-xl bg-secondary/65 px-3 py-2"
                    key={task.uuid}
                  >
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </Text>
                    <Text
                      className="flex-1 text-sm font-medium"
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatMinutes(task.estimated_time)}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="rounded-xl bg-secondary/55 px-3 py-2">
                  <Text className="text-sm text-muted-foreground">
                    暂无待处理任务
                  </Text>
                </View>
              )}
            </CardContent>
            <CardContent className="flex-row items-center gap-2 px-4 pb-3 pt-1">
              {collection.notion_databases?.length ? (
                <View className="rounded-full bg-secondary px-2 py-1">
                  <Text className="text-[11px] font-medium">Notion</Text>
                </View>
              ) : null}
              {collection.clickup_lists?.length ? (
                <View className="rounded-full bg-secondary px-2 py-1">
                  <Text className="text-[11px] font-medium">ClickUp</Text>
                </View>
              ) : null}
              <Text className="ml-auto text-xs text-muted-foreground">
                {collection.pending_count} 待处理 ·{" "}
                {formatMinutes(collection.estimated_total)}
              </Text>
            </CardContent>
          </Card>
        </Pressable>
      ))}
    </Page>
  );
}
