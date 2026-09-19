const REQUIRED_STATUS_MAPPING_KEYS = [
  "backlog",
  "this_week",
  "today",
  "done",
] as const;

export function hasCompleteStatusMapping(
  mapping?: Record<string, string>,
): boolean {
  return REQUIRED_STATUS_MAPPING_KEYS.every((key) => Boolean(mapping?.[key]));
}
