export const PermissionCategory = {
  Admin: 'admin',
  Frontend: 'frontend',
} as const
export type PermissionCategory =
  (typeof PermissionCategory)[keyof typeof PermissionCategory]

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
