export interface ICollection {
  uuid: string;
  name: string;
  icon: string;
  notion_uuid?: string;
  pending_count: number;
  estimated_total: number;
  is_archived: boolean;
  notion_databases?: INotionDatabase[];
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
  notion_uuid?: string;
  estimated_time: number;
  actual_time: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "backlog" | "this_week" | "today" | "done";

export interface ITimeSession {
  uuid: string;
  task_uuid: string;
  started_at: string;
  ended_at?: string;
  duration: number;
}

export interface INotionDatabase {
  uuid: string;
  collection_uuid: string;
  notion_database_id: string;
  icon?: string;
  status_mapping?: Record<string, string>;
  notion_options?: string[];
  created_at: string;
  updated_at: string;
  title: string;
  name: string;
}

export interface IStatusMapping {
  backlog: string[];
  today: string[];
  done: string[];
  this_week?: string[];
}

export interface IUser {
  uuid: string;
  notion_user_id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
