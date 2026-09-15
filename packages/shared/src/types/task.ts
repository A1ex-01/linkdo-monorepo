/** Status values returned by the Linkdo task API. */
export type TaskStatus = "backlog" | "this_week" | "today" | "done";

/** Shared task representation used by the Desktop and Admin applications. */
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

export interface ITimeSession {
  uuid: string;
  task_uuid: string;
  started_at: string;
  ended_at?: string;
  duration: number;
}
