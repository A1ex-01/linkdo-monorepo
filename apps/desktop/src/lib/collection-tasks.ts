import type { ITask } from "@/types/base";

export function getTaskPreview(tasks: ITask[]): ITask[] {
  return tasks.slice(0, 5);
}
