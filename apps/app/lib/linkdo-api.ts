export type TaskStatus = "backlog" | "this_week" | "today" | "done";

export interface Task {
  uuid: string;
  collection_uuid: string;
  title: string;
  content: string;
  status: TaskStatus;
  estimated_time: number;
  actual_time: number;
  scheduled_date?: string;
  completed_at?: string;
  initial_status?: TaskStatus;
  notion_database_uuid?: string;
  clickup_list_uuid?: string;
  notion_page_id?: string;
  clickup_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectedSource {
  uuid: string;
  collection_uuid: string;
  name: string;
  title?: string;
  icon?: string;
  notion_options?: string[];
  status_mapping?: Record<string, string> | string;
}

export interface RemoteTaskCandidate {
  remote_id: string;
  title: string;
  remote_status: string;
  url?: string;
}

export interface Collection {
  uuid: string;
  name: string;
  icon: string;
  cover?: string;
  pending_count: number;
  estimated_total: number;
  is_archived: boolean;
  notion_databases?: { uuid: string; title: string; name: string }[];
  clickup_lists?: { uuid: string; name: string }[];
}

export interface ReportInsights {
  summary: {
    total_work_days: number;
    completed_tasks: number;
    total_tasks: number;
    estimated_time_minutes: number;
    actual_time_minutes: number;
    active_tasks: number;
    completion_rate: number;
    focus_session_count: number;
  };
  top_tasks: {
    task_uuid: string;
    task_title: string;
    collection_name: string;
    status: string;
    actual_minutes: number;
    estimated_minutes: number;
  }[];
  timeline: {
    date: string;
    started_count: number;
    completed_count: number;
    focus_minutes: number;
  }[];
  collection_breakdown: {
    collection_uuid: string;
    collection_name: string;
    collection_icon?: string;
    total: number;
    completed: number;
    in_progress: number;
    backlog: number;
    estimated_minutes: number;
    actual_minutes: number;
  }[];
  status_breakdown: { key: string; count: number }[];
  source_breakdown: { key: string; count: number }[];
}

export interface ReportSession {
  uuid: string;
  task_title: string;
  collection_name: string;
  started_at: string;
  ended_at?: string;
  duration: number;
}

type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
type Fetcher = typeof fetch;
type Query = {
  startDate?: string;
  endDate?: string;
  collectionUuids?: string[];
};

export function createLinkdoApi({
  baseUrl,
  fetcher = fetch,
  getToken,
}: {
  baseUrl: string;
  fetcher?: Fetcher;
  getToken: () => Promise<string | null>;
}) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  async function get<T>(path: string): Promise<T> {
    const token = await getToken();
    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = (await response.json()) as ApiPayload<T>;
    if (!response.ok || !payload.success)
      throw new Error(
        payload.error ?? payload.message ?? "Unable to load Linkdo data",
      );
    return payload.data as T;
  }

  const query = (value?: Query) => {
    if (!value) return "";
    const params = new URLSearchParams();
    if (value.startDate) params.set("start_date", value.startDate);
    if (value.endDate) params.set("end_date", value.endDate);
    value.collectionUuids?.forEach((uuid) =>
      params.append("collection_uuids", uuid),
    );
    const result = params.toString();
    return result ? `?${result}` : "";
  };

  return {
    getMe: () =>
      get<{
        uuid: string;
        name: string;
        email?: string;
        avatar_url?: string;
        notion_user_id?: string;
        clickup_connected?: boolean;
      }>("/api/auth/me"),
    getCollections: () => get<Collection[]>("/api/collections"),
    getCollection: (uuid: string) =>
      get<Collection>(`/api/collections/${uuid}`),
    getTasks: (collectionUuid: string) =>
      get<Task[]>(`/api/collections/${collectionUuid}/tasks`),
    getCollectionSources: async (collectionUuid: string) => {
      const [notion, clickup] = await Promise.all([
        get<ConnectedSource[]>(
          `/api/collections/${collectionUuid}/notion-databases`,
        ),
        get<ConnectedSource[]>(
          `/api/collections/${collectionUuid}/clickup-lists`,
        ),
      ]);
      return { notion, clickup };
    },
    getRemoteTaskCandidates: (
      platform: "notion" | "clickup",
      sourceUuid: string,
    ) =>
      get<RemoteTaskCandidate[]>(
        `/api/${platform === "notion" ? "notion-databases" : "clickup-lists"}/${sourceUuid}/import-candidates`,
      ),
    getCurrentTimer: () =>
      get<{
        uuid: string;
        task_uuid: string;
        started_at: string;
        ended_at?: string;
        duration: number;
      } | null>("/api/timer/current"),
    getReportInsights: (filters?: Query) =>
      get<ReportInsights>(`/api/reports/insights${query(filters)}`),
    getReportSummary: (filters?: Query) =>
      get<ReportInsights["summary"]>(`/api/reports/summary${query(filters)}`),
    getReportTimeline: (filters?: Query) =>
      get<ReportInsights["timeline"]>(`/api/reports/timeline${query(filters)}`),
    getReportBreakdown: (filters?: Query) =>
      get<ReportInsights["collection_breakdown"]>(
        `/api/reports/breakdown${query(filters)}`,
      ),
    getReportSessions: (filters?: Query) =>
      get<ReportSession[]>(`/api/reports/sessions${query(filters)}`),
  };
}
