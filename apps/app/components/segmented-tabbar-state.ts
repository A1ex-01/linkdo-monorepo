export const tabRouteNames = [
  "collections",
  "search",
  "focus",
  "reports",
  "mine",
] as const;

export function getSelectedSegmentIndex(
  routeNames: readonly string[],
  selectedRouteIndex: number,
) {
  const selectedRouteName = routeNames[selectedRouteIndex];
  const selectedSegmentIndex = tabRouteNames.indexOf(
    selectedRouteName as (typeof tabRouteNames)[number],
  );

  return Math.max(0, selectedSegmentIndex);
}
