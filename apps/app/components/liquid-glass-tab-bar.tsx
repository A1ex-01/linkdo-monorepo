import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
} from "expo-glass-effect";
import { useAppAppearance } from "@/lib/appearance";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import {
  BarChart3Icon,
  FolderKanbanIcon,
  SearchIcon,
  TimerIcon,
  UserRoundIcon,
} from "lucide-react-native";
import * as React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

  const supportsLiquidGlass = React.useMemo(() => {
    try {
      return Platform.OS === "ios" && isGlassEffectAPIAvailable();
    } catch {
      return false;
    }
  }, []);

  const tabs = routes.map((route) => {
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

    const tabBody = (
      <>
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
      </>
    );

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

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        onLongPress={() =>
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          })
        }
        style={styles.tabPressable}
      >
        {focused && supportsLiquidGlass ? (
          <GlassView
            colorScheme={isDark ? "dark" : "light"}
            glassEffectStyle="regular"
            isInteractive
            tintColor={
              isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.20)"
            }
            style={styles.selectedGlass}
          >
            {tabBody}
          </GlassView>
        ) : (
          <View style={styles.tabContent}>
            {tabBody}
          </View>
        )}
      </Pressable>
    );
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {supportsLiquidGlass ? (
        // 注意：
        // 外层现在是普通 View，而不是 GlassView
        <View style={styles.dockShell}>
          {/* 整个 Dock 的玻璃背景 */}
          <GlassView
            colorScheme={isDark ? "dark" : "light"}
            glassEffectStyle="clear"
            style={StyleSheet.absoluteFill}
          />

          {/* Tab 内容 */}
          <View style={styles.tabs}>
            {tabs}
          </View>
        </View>
      ) : (
        <BlurView
          intensity={Platform.OS === "android" ? 80 : 64}
          tint={tint}
          style={[
            styles.dock,
            {
              backgroundColor: isDark
                ? "rgba(24,24,27,0.72)"
                : "rgba(255,255,255,0.72)",
            },
          ]}
        >
          {tabs}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    paddingHorizontal: 16,
  },

  /**
   * iOS 26 Liquid Glass 外层
   *
   * 重点：
   * 不再直接用 GlassView 包 tabs。
   */
  dockShell: {
    minHeight: 68,

    borderRadius: 34,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },

  tabs: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",
  },

  /**
   * 非 Liquid Glass fallback
   */
  dock: {
    flexDirection: "row",
    alignItems: "center",

    minHeight: 68,

    borderRadius: 34,
    overflow: "hidden",

    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.38)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },

  tabPressable: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 7,
  },

  tabContent: {
    minWidth: 56,
    minHeight: 50,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * 当前选中的 Liquid Glass 胶囊
   */
  selectedGlass: {
    minWidth: 56,
    minHeight: 50,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",
  },
});