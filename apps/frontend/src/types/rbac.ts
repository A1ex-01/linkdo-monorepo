export const PermissionCategory = {
  Admin: 'admin',
  Frontend: 'frontend',
} as const
export type PermissionCategory = (typeof PermissionCategory)[keyof typeof PermissionCategory]

export const Permission = {
  TasksRead: 'tasks:read',
  TasksWrite: 'tasks:write',
  TasksDelete: 'tasks:delete',
  CollectionsRead: 'collections:read',
  CollectionsWrite: 'collections:write',
  CollectionsDelete: 'collections:delete',
  UsersRead: 'users:read',
  UsersWrite: 'users:write',
  UsersDelete: 'users:delete',
  RolesRead: 'roles:read',
  RolesWrite: 'roles:write',
  StatsView: 'stats:view',
  SessionsRead: 'sessions:read',
  SettingsRead: 'settings:read',
  SettingsWrite: 'settings:write',
  NotionSyncEnable: 'notion_sync:enable',
  FocusModeAccess: 'focus_mode:access',
  BulkOpsAccess: 'bulk_operations:access',
  ExportAccess: 'export:access',
} as const
export type PermissionCode = (typeof Permission)[keyof typeof Permission]

export interface IRole {
  id: number
  name: string
  description: string
  is_system: boolean
  permissions: IPermission[]
}

export interface IPermission {
  id: number
  code: string
  name: string
  category: PermissionCategory
  description: string
}
