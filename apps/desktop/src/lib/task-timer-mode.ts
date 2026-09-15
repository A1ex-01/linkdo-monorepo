export type TaskTimerMode = "countdown" | "stopwatch";

export function getEstimatedMinutes(
  mode: TaskTimerMode,
  duration: string,
): number {
  if (mode === "stopwatch") return 0;

  const [hours, minutes] = duration.split(":").map(Number);
  return hours * 60 + minutes;
}
