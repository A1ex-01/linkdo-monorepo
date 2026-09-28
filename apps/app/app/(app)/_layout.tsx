import { Tabs } from "expo-router";
import { LiquidGlassTabBar } from "@/components/liquid-glass-tab-bar";
import {
  BarChart3Icon,
  FolderKanbanIcon,
  SearchIcon,
  TimerIcon,
  UserRoundIcon,
} from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerTitleStyle: { fontWeight: "700" },
        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      <Tabs.Screen
        name="collections"
        options={{
          title: "Collections",
          tabBarIcon: ({ color }) => <FolderKanbanIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <SearchIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: "Focus",
          tabBarIcon: ({ color }) => <TimerIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <BarChart3Icon color={color} />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: "Mine",
          tabBarIcon: ({ color }) => <UserRoundIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", href: null }}
      />
    </Tabs>
  );
}
