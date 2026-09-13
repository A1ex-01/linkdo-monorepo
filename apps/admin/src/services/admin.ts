import { request } from './client-request'

export interface User {
  uuid: string
  notion_user_id: string
  clickup_connected?: boolean
  email?: string
  name: string
  avatar?: string
  avatar_url?: string
  role_id?: number
  role_name?: string
  created_at: string
  updated_at: string
}

export interface Task {
  uuid: string
  collection_uuid: string
  notion_database_uuid?: string
  clickup_list_uuid?: string
  title: string
  content?: string
  status: string
  initial_status?: string
  estimated_time: number
  actual_time: number
  scheduled_date?: string
  notion_page_id?: string
  clickup_task_id?: string
  completed_at?: string
  sort_order?: string
  created_at: string
  updated_at: string
}

export interface Collection {
  uuid: string
  name: string
  icon: string
  cover?: string
  pending_count: number
  estimated_total: number
  is_archived: boolean
  notion_databases?: NotionDatabase[]
  clickup_lists?: ClickUpList[]
  created_at: string
  updated_at: string
}

export interface NotionDatabase {
  uuid: string
  collection_uuid: string
  notion_database_id: string
  name: string
  icon?: string
  status_mapping?: string | Record<string, string>
  notion_options?: string[]
  created_at: string
  updated_at: string
}

export interface ClickUpList {
  uuid: string
  collection_uuid: string
  workspace_id: string
  space_id: string
  folder_id?: string
  clickup_list_id: string
  name: string
  status_mapping?: string | Record<string, string>
  created_at: string
  updated_at: string
}

export interface TimeSession {
  uuid: string
  task_uuid: string
  started_at: string
  ended_at?: string
  duration: number
}

export interface ReportSession extends TimeSession {
  task_title: string
  collection_uuid: string
  collection_name: string
}

export interface ReportSummary {
  total_work_days: number
  completed_tasks: number
  total_tasks: number
  estimated_time_minutes: number
  actual_time_minutes: number
}

export interface CollectionBreakdown {
  collection_uuid: string
  collection_name: string
  collection_icon?: string
  total: number
  completed: number
  in_progress: number
  backlog: number
  estimated_minutes: number
  actual_minutes: number
}

export interface TimelinePoint {
  date: string
  started_count: number
  completed_count: number
  focus_minutes: number
}

export interface FileUploadResult {
  path: string
}

export interface StatusMappingResult {
  mapping?: Record<string, string>
  options?: string[]
}

export interface AdminStats {
  total_users: number
  total_tasks: number
  total_todos: number
  today_done: number
}

export interface PaginatedData<T> {
  current: number
  pageSize: number
  total: number
  list: T[]
}

export interface ListUsersParams {
  keyword?: string
  current?: number
  pageSize?: number
}

export interface ListTasksParams {
  user_uuid?: string
  status?: string
  start_date?: string
  end_date?: string
  current?: number
  pageSize?: number
}

export interface ListCollectionsParams {
  user_uuid?: string
  current?: number
  pageSize?: number
}

export interface ReportQueryParams {
  collection_uuids?: string[]
  start_date?: string
  end_date?: string
}

function paginate<T>(
  items: T[],
  current = 1,
  pageSize = 10
): PaginatedData<T> {
  const page = Math.max(1, current)
  const size = Math.max(1, pageSize)
  const start = (page - 1) * size
  return {
    current: page,
    pageSize: size,
    total: items.length,
    list: items.slice(start, start + size),
  }
}

function todayPrefix() {
  return new Date().toISOString().slice(0, 10)
}

async function listAllTasks(): Promise<Task[]> {
  const collections = await request<Collection[]>({
    url: '/collections',
    method: 'get',
  })
  if (!collections.success || !collections.data) return []
  const batches = await Promise.all(
    collections.data.map((collection) =>
      request<Task[]>({
        url: `/collections/${collection.uuid}/tasks`,
        method: 'get',
      })
    )
  )
  return batches.flatMap((batch) => (batch.success && batch.data ? batch.data : []))
}

export const adminService = {
  getMe: () => request<User>({ url: '/auth/me', method: 'get' }),

  async listUsers(params: ListUsersParams = {}) {
    const res = await request<User>({ url: '/auth/me', method: 'get' })
    const users = res.success && res.data ? [res.data] : []
    const keyword = params.keyword?.toLowerCase()
    const filtered = keyword
      ? users.filter((user) =>
          [user.name, user.email, user.notion_user_id]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(keyword))
        )
      : users
    return {
      success: res.success,
      data: paginate(filtered, params.current, params.pageSize),
      error: res.error,
    }
  },

  async listTasks(params: ListTasksParams = {}) {
    const tasks = await listAllTasks()
    const filtered = tasks.filter((task) => {
      if (params.status && task.status !== params.status) return false
      if (params.start_date && task.created_at < params.start_date) return false
      if (params.end_date && task.created_at > params.end_date) return false
      return true
    })
    return {
      success: true,
      data: paginate(filtered, params.current, params.pageSize),
      error: undefined,
    }
  },

  async listCollections(params: ListCollectionsParams = {}) {
    const res = await request<Collection[]>({ url: '/collections', method: 'get' })
    return {
      success: res.success,
      data: paginate(res.data ?? [], params.current, params.pageSize),
      error: res.error,
    }
  },

  async getStats() {
    const [me, collections, tasks] = await Promise.all([
      request<User>({ url: '/auth/me', method: 'get' }),
      request<Collection[]>({ url: '/collections', method: 'get' }),
      listAllTasks(),
    ])
    return {
      success: true,
      data: {
        total_users: me.success && me.data ? 1 : 0,
        total_tasks: tasks.length,
        total_todos: collections.data?.length ?? 0,
        today_done: tasks.filter(
          (task) =>
            task.status === 'done' &&
            (task.completed_at ?? task.updated_at ?? '').startsWith(todayPrefix())
        ).length,
      },
    }
  },

  async getTaskSessions(taskUuid: string) {
    const res = await request<ReportSession[]>({
      url: '/reports/sessions',
      method: 'get',
    })
    return {
      success: res.success,
      data: (res.data ?? []).filter((session) => session.task_uuid === taskUuid),
      error: res.error,
    }
  },

  listNotionDatabases: () =>
    request<NotionDatabase[]>({ url: '/notion-databases', method: 'get' }),

  listClickUpLists: () =>
    request<ClickUpList[]>({ url: '/clickup-lists', method: 'get' }),

  getNotionStatusMapping: (uuid: string) =>
    request<StatusMappingResult>({
      url: `/notion-databases/${uuid}/status-mapping`,
      method: 'get',
    }),

  fetchNotionStatusOptions: (uuid: string) =>
    request<string[]>({
      url: `/notion-databases/${uuid}/status-mapping/fetch`,
      method: 'post',
    }),

  getClickUpStatusMapping: (uuid: string) =>
    request<StatusMappingResult>({
      url: `/clickup-lists/${uuid}/status-mapping`,
      method: 'get',
    }),

  fetchClickUpStatusOptions: (uuid: string) =>
    request<string[]>({
      url: `/clickup-lists/${uuid}/status-mapping/fetch`,
      method: 'post',
    }),

  getReportSummary: (params?: ReportQueryParams) =>
    request<ReportSummary>({
      url: '/reports/summary',
      method: 'get',
      params,
    }),

  getReportBreakdown: (params?: ReportQueryParams) =>
    request<CollectionBreakdown[]>({
      url: '/reports/breakdown',
      method: 'get',
      params,
    }),

  getReportTimeline: (params?: ReportQueryParams) =>
    request<TimelinePoint[]>({
      url: '/reports/timeline',
      method: 'get',
      params,
    }),

  getReportSessions: (params?: ReportQueryParams) =>
    request<ReportSession[]>({
      url: '/reports/sessions',
      method: 'get',
      params,
    }),

  getCurrentTimer: () => request({ url: '/timer/current', method: 'get' }),

  startTimer: (taskUuid: string) =>
    request<TimeSession>({
      url: `/tasks/${taskUuid}/timer/start`,
      method: 'post',
    }),

  stopTimer: (taskUuid: string) =>
    request<void>({
      url: `/tasks/${taskUuid}/timer/stop`,
      method: 'post',
    }),

  sync: () => request<void>({ url: '/sync', method: 'post' }),

  getLinkOAuthURL: (platform: 'notion' | 'clickup') =>
    request<{ url: string }>({ url: `/link/${platform}/url`, method: 'get' }),

  listLinkNotionDatabases: (params?: { query?: string }) =>
    request({
      url: '/link/notion/databases',
      method: 'get',
      params,
    }),

  listClickUpResources: (params?: { path?: string }) =>
    request({
      url: '/link/clickup/resources',
      method: 'get',
      params,
    }),

  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<FileUploadResult>({
      url: '/files/upload',
      method: 'post',
      data: formData,
    })
  },
}
