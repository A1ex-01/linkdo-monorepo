// desktop/src/types/work.ts

import type {
  ICollection,
  IStatusMapping,
  ITask,
  TaskStatus,
} from "./base";

// Re-export shared types for work page convenience
export type {
  ICollection as Collection,
  IStatusMapping,
  ITask as Task,
  TaskStatus,
};

export type ColumnId = "backlog" | "thisWeek" | "today" | "done";

export interface UpdateTaskDTO {
  title?: string;
  estimated_time?: number;
  status?: TaskStatus;
  sort_order?: number;
}

export type ViewMode = "kanban" | "focus" | "collection" | "timer";
