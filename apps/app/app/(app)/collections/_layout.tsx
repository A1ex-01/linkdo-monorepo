import { Stack } from "expo-router";

export default function CollectionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "工作区" }} />
      <Stack.Screen name="[uuid]" options={{ title: "Collection" }} />
      <Stack.Screen name="[uuid]/sources" options={{ title: "Sources" }} />
      <Stack.Screen
        name="[uuid]/tasks/[taskUuid]"
        options={{ title: "Task detail" }}
      />
    </Stack>
  );
}
