/* eslint-disable */
// Link-Do Admin API Types

declare namespace API {
  interface PageInfo<T = Record<string, any>> {
    current?: number;
    pageSize?: number;
    total?: number;
    list?: T[];
  }

  interface Result<T = any> {
    success?: boolean;
    error?: string;
    message?: string;
    data?: T;
  }

  interface Result_PageInfo__<T = any> {
    success?: boolean;
    error?: string;
    message?: string;
    data?: PageInfo<T>;
  }

  // --- Auth ---
  interface LoginVO {
    email?: string;
    code?: string;
  }

  interface LoginResult {
    token?: string;
    user?: UserInfo;
  }

  interface UserInfo {
    uuid?: string;
    notion_user_id?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
  }

  // --- Task ---
  type TaskStatus = 'backlog' | 'this_week' | 'today' | 'done';

  interface TaskInfo {
    uuid?: string;
    collection_uuid?: string;
    title?: string;
    status?: TaskStatus;
    estimated_time?: number;
    actual_time?: number;
    completed_at?: string;
    created_at?: string;
    updated_at?: string;
    user_name?: string;
    user_email?: string;
    collection_name?: string;
  }

  // --- Collection ---
  interface CollectionInfo {
    uuid?: string;
    name?: string;
    icon?: string;
    pending_count?: number;
    estimated_total?: number;
    created_at?: string;
    updated_at?: string;
    user_name?: string;
    user_email?: string;
  }

  // --- Timer ---
  interface TimeSessionInfo {
    uuid?: string;
    task_uuid?: string;
    started_at?: string;
    ended_at?: string;
    duration?: number;
  }

  // --- Stats ---
  interface StatsInfo {
    total_users?: number;
    total_tasks?: number;
    total_todos?: number;
    today_done?: number;
  }
}
