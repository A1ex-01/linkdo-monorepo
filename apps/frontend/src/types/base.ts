export interface ICollection {
  uuid: string;
  name: string;
  icon: string;
  pending_count: number;
  estimated_total: number;
  is_archived: boolean;
  notion_databases?: INotionDatabase[];
  clickup_lists?: IClickUpList[];
  created_at: string;
  updated_at: string;
}

export interface ITask {
  uuid: string;
  collection_uuid: string;
  notion_database_uuid?: string;
  clickup_list_uuid?: string;
  title: string;
  content: string;
  status: TaskStatus;
  initial_status?: TaskStatus;
  notion_page_id?: string;
  clickup_task_id?: string;
  estimated_time: number;
  actual_time: number;
  scheduled_date?: string;
  completed_at?: string;
  sort_order?: string;
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

export interface IClickUpList {
  uuid: string;
  collection_uuid: string;
  workspace_id: string;
  space_id: string;
  folder_id?: string;
  clickup_list_id: string;
  name: string;
  status_mapping?: Record<string, string>;
  created_at: string;
  updated_at: string;
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

// ============================================================================
// Reports
// ============================================================================

/**
 * Query parameters shared by all reports endpoints.
 * `start_date` / `end_date` are inclusive ISO date strings (YYYY-MM-DD).
 */
export interface IReportQuery {
  collection_uuids?: string[];
  start_date?: string;
  end_date?: string;
}

export interface IReportSummary {
  total_work_days: number;
  completed_tasks: number;
  total_tasks: number;
  estimated_time_minutes: number;
  actual_time_minutes: number;
}

export interface ICollectionBreakdown {
  collection_uuid: string;
  collection_name: string;
  collection_icon?: string;
  total: number;
  completed: number;
  in_progress: number;
  backlog: number;
  estimated_minutes: number;
  actual_minutes: number;
}

export interface ITimelinePoint {
  date: string; // YYYY-MM-DD
  started_count: number;
  completed_count: number;
  focus_minutes: number;
}
