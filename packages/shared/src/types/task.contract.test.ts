import type { ITask, TaskStatus } from "./task";

const status: TaskStatus = "today";

const task: ITask = {
  uuid: "task-1",
  collection_uuid: "collection-1",
  title: "Shared task",
  content: "",
  status,
  estimated_time: 30,
  actual_time: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

void task;
