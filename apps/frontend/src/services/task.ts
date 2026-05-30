// frontend/src/services/task.ts

import type { ITask, TaskStatus } from "@/types/base";
import { request } from "./base";

export interface CreateTaskDTO {
  title: string;
  estimated_time?: number;
  notion_database_uuid?: string;
  status?: TaskStatus;
}

export interface UpdateTaskDTO {
  title?: string;
  estimated_time?: number;
}

export function createTask(collectionUuid: string, data: CreateTaskDTO) {
  return request<ITask>({
    url: `/api/v1/collections/${collectionUuid}/tasks`,
    method: "post",
    data,
  });
}

export function updateTask(taskUuid: string, data: UpdateTaskDTO) {
  return request<void>({
    url: `/api/v1/tasks/${taskUuid}`,
    method: "patch",
    data,
  });
}

export function updateTaskStatus(taskUuid: string, status: TaskStatus) {
  return request<void>({
    url: `/api/v1/tasks/${taskUuid}/status`,
    method: "patch",
    data: { status },
  });
}

export function deleteTask(taskUuid: string) {
  return request<void>({
    url: `/api/v1/tasks/${taskUuid}`,
    method: "delete",
  });
}
