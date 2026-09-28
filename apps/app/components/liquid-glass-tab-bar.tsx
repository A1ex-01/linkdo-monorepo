import { BlurView } from "expo-blur";
import { useAppAppearance } from "@/lib/appearance";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import {
  BarChart3Icon,
  FolderKanbanIcon,
  SearchIcon,
  TimerIcon,
  UserRoundIcon,
} from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
  const { resolvedColorScheme } = useAppAppearance();
  const insets = useSafeAreaInsets();
  const isDark = resolvedColorScheme === "dark";
  const tint = isDark
    ? "systemUltraThinMaterialDark"
    : "systemUltraThinMaterialLight";
  const routes = state.routes.filter((route) => route.name in tabMeta);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <BlurView
        intensity={Platform.OS === "android" ? 80 : 64}
        tint={tint}
        style={[
          styles.dock,
          {
            backgroundColor: isDark
              ? "rgba(24, 24, 27, 0.72)"
              : "rgba(255, 255, 255, 0.72)",
          },
        ]}
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
              style={styles.tabPressable}
            >
              <View
                style={[
                  styles.tabContent,
                  focused && {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.14)"
                      : "rgba(255, 255, 255, 0.58)",
                  },
                ]}
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

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    position: "absolute",
    right: 0,
  },
  dock: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.38)",
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 68,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  tabContent: {
    alignItems: "center",
    borderRadius: 16,
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabPressable: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
});
