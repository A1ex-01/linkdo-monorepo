import { BlurView } from "expo-blur";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import {
  BarChart3Icon,
  FolderKanbanIcon,
  SearchIcon,
  TimerIcon,
  UserRoundIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabMeta = {
  collections: { label: "Collections", Icon: FolderKanbanIcon },
  search: { label: "Search", Icon: SearchIcon },
  focus: { label: "Focus", Icon: TimerIcon },
  reports: { label: "Reports", Icon: BarChart3Icon },
  mine: { label: "Mine", Icon: UserRoundIcon },
} as const;

export function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const tint = isDark
    ? "systemUltraThinMaterialDark"
    : "systemUltraThinMaterialLight";
  const routes = state.routes.filter((route) => route.name in tabMeta);

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 px-4"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <BlurView
        intensity={Platform.OS === "android" ? 80 : 64}
        tint={tint}
        className="flex-row overflow-hidden rounded-[28px] border border-white/35 shadow-2xl shadow-black/25"
        style={{
          backgroundColor: isDark
            ? "rgba(24, 24, 27, 0.72)"
            : "rgba(255, 255, 255, 0.72)",
        }}
      >
        {routes.map((route) => {
          const index = state.routes.findIndex(
            (item) => item.key === route.key,
          );
          const focused = state.index === index;
          const meta = tabMeta[route.name as keyof typeof tabMeta];
          const Icon = meta.Icon;
          const options = descriptors[route.key]?.options;
          const label =
            typeof options?.tabBarLabel === "string"
              ? options.tabBarLabel
              : meta.label;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              className="flex-1 items-center py-2"
            >
              <View
                className={
                  focused
                    ? "min-w-14 items-center rounded-2xl bg-white/50 px-2 py-1.5 dark:bg-white/15"
                    : "min-w-14 items-center px-2 py-1.5"
                }
              >
                <Icon
                  size={19}
                  color={
                    focused
                      ? isDark
                        ? "#FFFFFF"
                        : "#111827"
                      : isDark
                        ? "#A1A1AA"
                        : "#71717A"
                  }
                  strokeWidth={focused ? 2.6 : 2}
                />
                <Text
                  className={
                    focused
                      ? "mt-1 text-[10px] font-semibold text-foreground"
                      : "mt-1 text-[10px] font-medium text-muted-foreground"
                  }
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}
