import { request } from './client-request'
import type {
  ICollection,
  ICollectionBreakdown,
  IClickUpList,
  INotionDatabase,
  IReportQuery,
  IReportSession,
  IReportSummary,
  ITask,
  ITimeSession,
  ITimelinePoint,
  IUser,
  TaskStatus,
} from '@linkdo/shared'

export interface IAdminUser extends IUser {
  avatar?: string
  role_id?: number
  role_name?: string
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
  status?: TaskStatus
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

async function listAllTasks(): Promise<ITask[]> {
  const collections = await request<ICollection[]>({
    url: '/collections',
    method: 'get',
  })
  if (!collections.success || !collections.data) return []
  const batches = await Promise.all(
    collections.data.map((collection) =>
      request<ITask[]>({
        url: `/collections/${collection.uuid}/tasks`,
        method: 'get',
      })
    )
  )
  return batches.flatMap((batch) => (batch.success && batch.data ? batch.data : []))
}

export const adminService = {
  getMe: () => request<IAdminUser>({ url: '/auth/me', method: 'get' }),

  async listUsers(params: ListUsersParams = {}) {
    const res = await request<IAdminUser>({ url: '/auth/me', method: 'get' })
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
    const res = await request<ICollection[]>({ url: '/collections', method: 'get' })
    return {
      success: res.success,
      data: paginate(res.data ?? [], params.current, params.pageSize),
      error: res.error,
    }
  },

  async getStats() {
    const [me, collections, tasks] = await Promise.all([
      request<IAdminUser>({ url: '/auth/me', method: 'get' }),
      request<ICollection[]>({ url: '/collections', method: 'get' }),
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
    const res = await request<IReportSession[]>({
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
    request<INotionDatabase[]>({ url: '/notion-databases', method: 'get' }),

  listClickUpLists: () =>
    request<IClickUpList[]>({ url: '/clickup-lists', method: 'get' }),

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

  getReportSummary: (params?: IReportQuery) =>
    request<IReportSummary>({
      url: '/reports/summary',
      method: 'get',
      params,
    }),

  getReportBreakdown: (params?: IReportQuery) =>
    request<ICollectionBreakdown[]>({
      url: '/reports/breakdown',
      method: 'get',
      params,
    }),

  getReportTimeline: (params?: IReportQuery) =>
    request<ITimelinePoint[]>({
      url: '/reports/timeline',
      method: 'get',
      params,
    }),

  getReportSessions: (params?: IReportQuery) =>
    request<IReportSession[]>({
      url: '/reports/sessions',
      method: 'get',
      params,
    }),

  getCurrentTimer: () => request({ url: '/timer/current', method: 'get' }),

  startTimer: (taskUuid: string) =>
    request<ITimeSession>({
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
