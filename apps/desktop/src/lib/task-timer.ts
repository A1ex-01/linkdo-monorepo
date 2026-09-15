export interface TaskTimerDisplay {
  value: string;
  isOverdue: boolean;
}

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
}

export function getTaskTimerDisplay(
  estimatedMinutes: number,
  elapsedSeconds: number,
): TaskTimerDisplay {
  const estimateSeconds = Math.max(0, estimatedMinutes) * 60;
  if (estimateSeconds === 0) {
    return { value: formatSeconds(elapsedSeconds), isOverdue: false };
  }

  const remainingSeconds = estimateSeconds - elapsedSeconds;
  if (remainingSeconds >= 0) {
    return { value: formatSeconds(remainingSeconds), isOverdue: false };
  }

  return {
    value: `+ ${formatSeconds(Math.abs(remainingSeconds))}`,
    isOverdue: true,
  };
}
