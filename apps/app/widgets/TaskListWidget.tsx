import { Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type TaskWidgetProps = {
  tasks: Array<{ title: string; status: string; collection: string }>;
  updatedAt: string;
};

const TaskListWidget = (
  props: TaskWidgetProps,
  environment: WidgetEnvironment,
) => {
  "widget";
  const isDark = environment.colorScheme === "dark";
  const foreground = isDark ? "#F8FAFC" : "#111827";
  const secondary = isDark ? "#A1A1AA" : "#6B7280";
  const visibleTasks = props.tasks.slice(
    0,
    environment.widgetFamily === "systemLarge" ? 6 : 3,
  );
  return (
    <VStack modifiers={[padding({ all: 14 })]} spacing={7}>
      <Text
        modifiers={[
          font({ weight: "bold", size: 16 }),
          foregroundStyle(foreground),
        ]}
      >
        Linkdo · 待办
      </Text>
      {visibleTasks.length ? (
        visibleTasks.map((task, index) => (
          <VStack key={`${task.title}-${index}`} spacing={1}>
            <Text
              modifiers={[
                font({ weight: "medium", size: 13 }),
                foregroundStyle(foreground),
              ]}
            >
              {task.title}
            </Text>
            <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>
              {task.collection} · {task.status}
            </Text>
          </VStack>
        ))
      ) : (
        <Text modifiers={[font({ size: 13 }), foregroundStyle(secondary)]}>
          暂无待办任务
        </Text>
      )}
    </VStack>
  );
};

export default createWidget<TaskWidgetProps>("LinkdoTaskList", TaskListWidget);
