import type { ITask, TaskStatus } from "@/types/base";

interface OptimisticTaskMove {
  tasks: ITask[];
  taskUuid: string;
  sourceStatus: TaskStatus;
  destinationStatus: TaskStatus;
  destinationIndex: number;
}

export function applyOptimisticTaskMove({
  tasks,
  taskUuid,
  sourceStatus,
  destinationStatus,
  destinationIndex,
}: OptimisticTaskMove): ITask[] {
  const moving = tasks.find((task) => task.uuid === taskUuid);
  if (!moving) return tasks;

  const sourceTasks = tasks.filter(
    (task) => task.status === sourceStatus && task.uuid !== taskUuid,
  );
  const destinationTasks =
    sourceStatus === destinationStatus
      ? sourceTasks
      : tasks.filter((task) => task.status === destinationStatus);
  const insertIndex = Math.max(
    0,
    Math.min(destinationIndex, destinationTasks.length),
  );
  const movedTask = { ...moving, status: destinationStatus };
  const rebuiltDestination = [
    ...destinationTasks.slice(0, insertIndex),
    movedTask,
    ...destinationTasks.slice(insertIndex),
  ];
  const replacementByStatus = new Map<TaskStatus, ITask[]>([
    [
      sourceStatus,
      sourceStatus === destinationStatus ? rebuiltDestination : sourceTasks,
    ],
    [destinationStatus, rebuiltDestination],
  ]);
  const emittedStatuses = new Set<TaskStatus>();
  const rebuilt: ITask[] = [];

  for (const task of tasks) {
    const replacement = replacementByStatus.get(task.status);
    if (!replacement) {
      rebuilt.push(task);
      continue;
    }
    if (!emittedStatuses.has(task.status)) {
      rebuilt.push(...replacement);
      emittedStatuses.add(task.status);
    }
  }

  if (!emittedStatuses.has(destinationStatus)) {
    rebuilt.push(...rebuiltDestination);
  }

  return rebuilt;
}
