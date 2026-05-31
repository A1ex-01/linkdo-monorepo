import { request } from './client-request'
import type { IRole, IPermission } from '@/types/rbac'

export type { IRole, IPermission }

export interface PaginatedData<T> {
  current: number
  pageSize: number
  total: number
  list: T[]
}

export interface ListRolesParams {
  keyword?: string
  current?: number
  pageSize?: number
}

export const adminRBACService = {
  listRoles: () =>
    request<IRole[]>({
      url: '/admin/roles',
      method: 'get',
    }),

  getRole: (id: number) =>
    request<IRole>({
      url: `/admin/roles/${id}`,
      method: 'get',
    }),

  createRole: (data: { name: string; description: string }) =>
    request<IRole>({
      url: '/admin/roles',
      method: 'post',
      data,
    }),

  updateRole: (id: number, data: { name?: string; description?: string }) =>
    request<IRole>({
      url: `/admin/roles/${id}`,
      method: 'put',
      data,
    }),

  deleteRole: (id: number) =>
    request<{ success: boolean }>({
      url: `/admin/roles/${id}`,
      method: 'delete',
    }),

  getRolePermissions: (id: number) =>
    request<IPermission[]>({
      url: `/admin/roles/${id}/permissions`,
      method: 'get',
    }),

  setRolePermissions: (id: number, permission_ids: number[]) =>
    request<{ success: boolean }>({
      url: `/admin/roles/${id}/permissions`,
      method: 'put',
      data: { permission_ids },
    }),

  listPermissions: (params?: { category?: string }) =>
    request<IPermission[]>({
      url: '/admin/permissions',
      method: 'get',
      params,
    }),

  assignUserRole: (userUuid: string, roleId: number | null) =>
    request<{ success: boolean }>({
      url: `/admin/users/${userUuid}/role`,
      method: 'put',
      data: { role_id: roleId },
    }),
}
