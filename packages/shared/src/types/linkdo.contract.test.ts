import type {
  ICollection,
  ICollectionBreakdown,
  IClickUpList,
  INotionDatabase,
  IReportQuery,
  IReportSession,
  IReportSummary,
  IStatusMapping,
  ITimelinePoint,
  IUser,
} from "./linkdo";

const user: IUser = {
  uuid: "user-1",
  notion_user_id: "notion-1",
  clickup_connected: false,
  name: "Linkdo",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const collection: ICollection = {
  uuid: "collection-1",
  name: "Inbox",
  icon: "inbox",
  pending_count: 0,
  estimated_total: 0,
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const database: INotionDatabase = {
  uuid: "database-1",
  collection_uuid: collection.uuid,
  notion_database_id: "notion-database-1",
  title: "Tasks",
  name: "Tasks",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const list: IClickUpList = {
  uuid: "list-1",
  collection_uuid: collection.uuid,
  workspace_id: "workspace-1",
  space_id: "space-1",
  clickup_list_id: "clickup-list-1",
  name: "Tasks",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const statusMapping: IStatusMapping = { backlog: [], today: [], done: [] };
const query: IReportQuery = { collection_uuids: [collection.uuid] };
const summary: IReportSummary = {
  total_work_days: 1,
  completed_tasks: 1,
  total_tasks: 1,
  estimated_time_minutes: 30,
  actual_time_minutes: 30,
};
const breakdown: ICollectionBreakdown = {
  collection_uuid: collection.uuid,
  collection_name: collection.name,
  total: 1,
  completed: 1,
  in_progress: 0,
  backlog: 0,
  estimated_minutes: 30,
  actual_minutes: 30,
};
const timeline: ITimelinePoint = {
  date: "2026-01-01",
  started_count: 1,
  completed_count: 1,
  focus_minutes: 30,
};
const session: IReportSession = {
  uuid: "session-1",
  task_uuid: "task-1",
  task_title: "Task",
  collection_uuid: collection.uuid,
  collection_name: collection.name,
  started_at: "2026-01-01T00:00:00Z",
  duration: 30,
};

void [user, database, list, statusMapping, query, summary, breakdown, timeline, session];
