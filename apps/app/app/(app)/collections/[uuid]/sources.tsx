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
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import { useLocalSearchParams } from "expo-router";
import { ExternalLinkIcon } from "lucide-react-native";
import * as React from "react";
import { Linking, View } from "react-native";

export default function SourcesPage() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const api = useLinkdoApi();
  const [data, setData] =
    React.useState<Awaited<ReturnType<typeof api.getCollectionSources>>>();
  const [selected, setSelected] = React.useState<{
    platform: "notion" | "clickup";
    uuid: string;
    name: string;
  }>();
  const [candidates, setCandidates] =
    React.useState<Awaited<ReturnType<typeof api.getRemoteTaskCandidates>>>();
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    api
      .getCollectionSources(uuid)
      .then(setData)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "无法加载 Sources"),
      );
  }, [api, uuid]);
  async function inspect(
    platform: "notion" | "clickup",
    source: { uuid: string; name: string; title?: string },
  ) {
    setSelected({
      platform,
      uuid: source.uuid,
      name: source.title || source.name,
    });
    try {
      setCandidates(await api.getRemoteTaskCandidates(platform, source.uuid));
    } catch {
      setCandidates([]);
    }
  }
  if (error) return <PageError message={error} />;
  if (!data) return <Loading />;
  return (
    <Page>
      <Text className="text-sm text-muted-foreground">
        连接、导入、移除和状态映射编辑仅可在桌面端完成；这里完整保留可查看内容。
      </Text>
      {[
        {
          platform: "notion" as const,
          title: "Notion databases",
          entries: data.notion,
        },
        {
          platform: "clickup" as const,
          title: "ClickUp lists",
          entries: data.clickup,
        },
      ].map((group) => (
        <Card key={group.platform}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {group.entries.length ? (
              group.entries.map((source) => (
                <View key={source.uuid} className="gap-2">
                  <Text>{source.title || source.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {source.status_mapping
                      ? Object.entries(source.status_mapping)
                          .map(([from, to]) => `${from} → ${to}`)
                          .join(" · ")
                      : "状态映射由桌面端管理"}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => void inspect(group.platform, source)}
                  >
                    <Text>查看远程任务</Text>
                  </Button>
                </View>
              ))
            ) : (
              <Text className="text-sm text-muted-foreground">未连接</Text>
            )}
          </CardContent>
        </Card>
      ))}
      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>{selected.name} 的远程任务</CardTitle>
            <CardDescription>只读，不会导入。</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {!candidates ? (
              <Loading />
            ) : (
              candidates.map((item) => (
                <View key={item.remote_id} className="flex-row gap-2">
                  <View className="flex-1">
                    <Text>{item.title}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {item.remote_status}
                    </Text>
                  </View>
                  {item.url ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => void Linking.openURL(item.url!)}
                    >
                      <ExternalLinkIcon />
                    </Button>
                  ) : null}
                </View>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </Page>
  );
}
