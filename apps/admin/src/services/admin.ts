import { request } from './client-request'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  uuid: string
  notion_user_id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Task {
  uuid: string
  collection_uuid: string
  title: string
  status: string
  estimated_time: number
  actual_time: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Collection {
  uuid: string
  name: string
  icon: string
  pending_count: number
  estimated_total: number
  is_archived: boolean
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

// ─── Admin Service ────────────────────────────────────────────────────────────

export const adminService = {
  listUsers: (params: ListUsersParams = {}) =>
    request<PaginatedData<User>>({ url: '/admin/users', method: 'get', params }),

  listTasks: (params: ListTasksParams = {}) =>
    request<PaginatedData<Task>>({ url: '/admin/tasks', method: 'get', params }),

  listCollections: (params: ListCollectionsParams = {}) =>
    request<PaginatedData<Collection>>({
      url: '/admin/collections',
      method: 'get',
      params,
    }),

  getStats: () => request<AdminStats>({ url: '/admin/stats', method: 'get' }),

  getTaskSessions: (taskUuid: string) =>
    request<TimeSession[]>({
      url: `/admin/tasks/${taskUuid}/sessions`,
      method: 'get',
    }),
}
