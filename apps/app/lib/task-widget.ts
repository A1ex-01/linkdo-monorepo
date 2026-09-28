import { Platform } from "react-native";

import TaskListWidget from "@/widgets/TaskListWidget";
import type { Collection, Task } from "./linkdo-api";

export function syncTaskWidget(
  collections: Collection[],
  taskGroups: Array<{ collectionUuid: string; tasks: Task[] }>,
) {
  if (Platform.OS !== "ios") return;
  const collectionNames = new Map(
    collections.map((collection) => [collection.uuid, collection.name]),
  );
  const tasks = taskGroups
    .flatMap(({ collectionUuid, tasks: group }) => group)
    .filter((task) => task.status !== "done")
    .sort(
      (left, right) =>
        (left.status === "today" ? -1 : 0) -
        (right.status === "today" ? -1 : 0),
    )
    .slice(0, 6)
    .map((task) => ({
      title: task.title,
      status:
        task.status === "today"
          ? "今天"
          : task.status === "this_week"
            ? "本周"
            : "待处理",
      collection: collectionNames.get(task.collection_uuid) ?? "Linkdo",
    }));
  TaskListWidget.updateSnapshot({ tasks, updatedAt: new Date().toISOString() });
}
