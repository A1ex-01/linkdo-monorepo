export type { IUser } from "./user";

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

export interface ICollection {
  uuid: string;
  name: string;
  icon: string;
  cover?: string;
  pending_count: number;
  estimated_total: number;
  is_archived: boolean;
  notion_databases?: INotionDatabase[];
  clickup_lists?: IClickUpList[];
  created_at: string;
  updated_at: string;
}

export interface IStatusMapping {
  backlog: string[];
  today: string[];
  done: string[];
  this_week?: string[];
}

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
  date: string;
  started_count: number;
  completed_count: number;
  focus_minutes: number;
}

export interface IReportSession {
  uuid: string;
  task_uuid: string;
  task_title: string;
  collection_uuid: string;
  collection_name: string;
  collection_icon?: string;
  started_at: string;
  ended_at?: string;
  duration: number;
}
