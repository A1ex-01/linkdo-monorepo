/* eslint-disable */
import { request } from '@umijs/max';

/** 获取用户列表 GET /api/v1/admin/users */
export async function listUsers(
  params: {
    /** keyword */
    keyword?: string;
    /** current */
    current?: number;
    /** pageSize */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request('/api/v1/admin/users', {
    method: 'GET',
    params: { ...params },
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

/** 获取所有任务（跨用户）GET /api/v1/admin/tasks */
export async function listAdminTasks(
  params: {
    user_uuid?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request('/api/v1/admin/tasks', {
    method: 'GET',
    params: { ...params },
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

/** 获取所有集合（To-Do List）GET /api/v1/admin/collections */
export async function listAdminCollections(
  params: {
    user_uuid?: string;
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request('/api/v1/admin/collections', {
    method: 'GET',
    baseURL: 'http://192.168.55.102:8080',
    params: { ...params },
    ...(options || {}),
  });
}

/** 获取统计数据 GET /api/v1/admin/stats */
export async function getStats(options?: { [key: string]: any }) {
  return request('/api/v1/admin/stats', {
    method: 'GET',
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

/** 获取任务时间记录 GET /api/v1/admin/tasks/${param0}/sessions */
export async function getTaskSessions(
  params: { taskUuid?: string },
  options?: { [key: string]: any },
) {
  const { taskUuid: param0 } = params;
  return request(`/api/v1/admin/tasks/${param0}/sessions`, {
    method: 'GET',
    baseURL: 'http://192.168.55.102:8080',
    params: { ...params },
    ...(options || {}),
  });
}
