// desktop/src/services/task.ts

import type { ITask, TaskStatus } from "@/types/base";
import { request } from "./base";

export interface CreateTaskDTO {
  title: string;
  estimated_time?: number;
  notion_database_uuid?: string;
  clickup_list_uuid?: string;
  status?: TaskStatus;
  /** Local datetime in `YYYY-MM-DD HH:mm:ss` format. */
  scheduled_date?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  content?: string;
  estimated_time?: number;
  /** Local datetime in `YYYY-MM-DD HH:mm:ss` format, or null to clear it. */
  scheduled_date?: string | null;
}

export function createTask(collectionUuid: string, data: CreateTaskDTO) {
  return request<ITask>({
    url: `/api/collections/${collectionUuid}/tasks`,
    method: "post",
    data,
  });
}

export function updateTask(taskUuid: string, data: UpdateTaskDTO) {
  return request<void>({
    url: `/api/tasks/${taskUuid}`,
    method: "patch",
    data,
  });
}

export function updateTaskStatus(taskUuid: string, status: TaskStatus) {
  return request<{ sort_order?: string }>({
    url: `/api/tasks/${taskUuid}/status`,
    method: "patch",
    data: { status },
  });
}

export function moveTask(
  taskUuid: string,
  data: { status: TaskStatus; prev_rank: string; next_rank: string },
) {
  return request<{ sort_order: string }>({
    url: `/api/tasks/${taskUuid}/move`,
    method: "patch",
    data,
  });
}

export function deleteTask(taskUuid: string) {
  return request<void>({
    url: `/api/tasks/${taskUuid}`,
    method: "delete",
  });
}
