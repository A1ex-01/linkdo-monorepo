import SegmentedControl from "@expo/ui/community/segmented-control";
import { useAppAppearance } from "@/lib/appearance";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { getSelectedSegmentIndex, tabRouteNames } from "./segmented-tabbar-state";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabMeta = {
  collections: "Collections",
  search: "Search",
  focus: "Focus",
  reports: "Reports",
  mine: "Mine",
} as const;

export function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { resolvedColorScheme } = useAppAppearance();
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) =>
    tabRouteNames.includes(route.name as (typeof tabRouteNames)[number]),
  );
  const values = routes.map((route) => {
    const label = descriptors[route.key]?.options.tabBarLabel;
    return typeof label === "string"
      ? label
      : tabMeta[route.name as keyof typeof tabMeta];
  });
  const selectedIndex = getSelectedSegmentIndex(
    state.routes.map((route) => route.name),
    state.index,
  );

  if (!routes.length) return null;

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
      <SegmentedControl
        appearance={resolvedColorScheme}
        onChange={(event) => {
          const route = routes[event.nativeEvent.selectedSegmentIndex];
          if (!route) return;

          const tabPress = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!tabPress.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        selectedIndex={selectedIndex}
        style={styles.segmentedControl}
        values={values}
      />
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

  segmentedControl: {
    width: "100%",
    height: 48,
  },
});
