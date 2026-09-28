import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { Task } from "@/lib/linkdo-api";
import { Pressable, View } from "react-native";

export function TaskCard({
  task,
  onPress,
}: {
  task: Task;
  onPress: () => void;
}) {
  const source = task.clickup_task_id
    ? "ClickUp"
    : task.notion_page_id
      ? "Notion"
      : "Linkdo";
  return (
    <Pressable onPress={onPress}>
      <Card>
        <CardContent className="gap-1">
          <View className="flex-row gap-2">
            <Text
              className={
                task.status === "done"
                  ? "flex-1 font-medium text-muted-foreground line-through"
                  : "flex-1 font-medium"
              }
            >
              {task.title}
            </Text>
            <Text className="text-xs text-muted-foreground">{source}</Text>
          </View>
          {task.content ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={2}>
              {task.content}
            </Text>
          ) : null}
          <Text className="text-xs text-muted-foreground">
            {task.scheduled_date || "未排期"} · 预计{" "}
            {formatMinutes(task.estimated_time)} · 已专注{" "}
            {formatMinutes(task.actual_time)}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}
