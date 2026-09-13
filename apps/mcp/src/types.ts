export type TaskStatus = "backlog" | "this_week" | "today" | "done";

export interface ICollection {
  uuid: string;
  name: string;
  icon: string;
  pending_count: number;
  estimated_total: number;
  is_archived: boolean;
  notion_databases?: INotionDatabase[];
  created_at: string;
  updated_at: string;
}

export interface INotionDatabase {
  uuid: string;
  collection_uuid: string;
  notion_database_id: string;
  name: string;
  icon: string;
  status_mapping?: Record<string, string[]>;
  notion_options?: string[];
  created_at: string;
  updated_at: string;
}

export interface ITask {
  uuid: string;
  collection_uuid: string;
  notion_database_uuid?: string;
  title: string;
  status: TaskStatus;
  notion_page_id?: string;
  estimated_time: number;
  actual_time: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LinkDoConfig {
  apiToken: string;
  baseUrl: string;
}

export type TodoStatus = TaskStatus;

export interface CreateTodoInput {
  title: string;
  collection_uuid?: string;
  estimated_time?: number;
  context?: string;
  status?: TodoStatus;
}

export interface UpdateTodoInput {
  task_uuid: string;
  title?: string;
  estimated_time?: number;
  status?: TodoStatus;
}

export interface DeleteTodoInput {
  task_uuid: string;
  confirm: boolean;
}
