import type { ITask } from "@/types/base";

export function searchTasksByTitle(tasks: ITask[], query: string): ITask[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return tasks.filter((task) =>
    task.title.toLocaleLowerCase().includes(normalizedQuery),
  );
}
