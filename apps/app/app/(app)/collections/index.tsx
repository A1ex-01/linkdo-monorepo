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
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setData((await api.getCollections()).filter((item) => !item.is_archived));
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
      {data.map((collection) => (
        <Pressable
          key={collection.uuid}
          onPress={() => router.push(`/(app)/collections/${collection.uuid}`)}
        >
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-xl bg-secondary">
                <Text className="text-xl">{collection.icon || "📋"}</Text>
              </View>
              <View className="flex-1">
                <CardTitle>{collection.name}</CardTitle>
                <CardDescription>
                  {collection.pending_count} 个待处理 · 预计{" "}
                  {formatMinutes(collection.estimated_total)}
                </CardDescription>
              </View>
            </CardHeader>
            <CardContent className="flex-row gap-2">
              <Text className="text-xs text-muted-foreground">
                {collection.notion_databases?.length ? "Notion" : ""}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {collection.clickup_lists?.length ? "ClickUp" : ""}
              </Text>
              <Text className="text-xs text-muted-foreground">
                打开只读工作区 ›
              </Text>
            </CardContent>
          </Card>
        </Pressable>
      ))}
    </Page>
  );
}
