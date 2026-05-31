import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { adminRBACService } from '@/services/admin-rbac'
import type { IRole, IPermission } from '@/services/admin-rbac'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const route = getRouteApi('/_authenticated/roles/$roleId')

function RoleDetailPage() {
  const { roleId } = route.useParams()

  const [role, setRole] = useState<IRole | null>(null)
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const numericId = Number(roleId)

  useEffect(() => {
    fetchData()
  }, [roleId])

  async function fetchData() {
    setLoading(true)
    try {
      const [roleRes, permsRes] = await Promise.all([
        adminRBACService.getRole(numericId),
        adminRBACService.listPermissions(),
      ])

      if (roleRes.success && roleRes.data) {
        setRole(roleRes.data)
        setName(roleRes.data.name)
        setDescription(roleRes.data.description)
        setSelectedIds(new Set(roleRes.data.permissions.map((p) => p.id)))
      } else {
        toast.error(roleRes.error || 'Failed to load role')
      }

      if (permsRes.success && permsRes.data) {
        setAllPermissions(permsRes.data)
      }
    } catch {
      toast.error('Failed to load role')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates: { name?: string; description?: string } = {}
      if (name.trim() !== role?.name) updates.name = name.trim()
      if (description.trim() !== role?.description) updates.description = description.trim()

      let roleRes: { success: boolean; error?: string } = { success: false }
      if (Object.keys(updates).length > 0) {
        roleRes = await adminRBACService.updateRole(numericId, updates)
        if (!roleRes.success) {
          toast.error(roleRes.error || 'Failed to update role')
          return
        }
      }

      const permRes = await adminRBACService.setRolePermissions(numericId, Array.from(selectedIds))
      if (permRes.success) {
        toast.success('Role saved successfully')
        fetchData()
      } else {
        toast.error(permRes.error || 'Failed to save permissions')
      }
    } catch {
      toast.error('Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const adminPerms = allPermissions.filter((p) => p.category === 'admin')
  const frontendPerms = allPermissions.filter((p) => p.category === 'frontend')

  if (loading) {
    return (
      <div className='flex flex-col gap-6 p-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-9 w-9' />
          <Skeleton className='h-6 w-48' />
        </div>
        <Skeleton className='h-12 w-64' />
        <Skeleton className='h-48 w-full' />
      </div>
    )
  }

  if (!role) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 p-6'>
        <p className='text-muted-foreground'>Role not found.</p>
        <Button variant='outline'           onClick={() => window.history.back()}>
          Back to Roles
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          className='size-9'
          onClick={() => window.history.back()}
        >
          <ArrowLeftIcon className='size-5' />
        </Button>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Role Details</h2>
          <p className='text-muted-foreground'>ID: {role.id}</p>
        </div>
      </div>

      {/* Role Info */}
      <div className='flex flex-col gap-4 rounded-lg border bg-card p-6'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold'>Role Information</h3>
          {!role.is_system && (
            <Button size='sm' onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={role.is_system}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={role.is_system}
            />
          </div>
        </div>

        {role.is_system && (
          <p className='text-xs text-muted-foreground'>
            System roles cannot be edited.
          </p>
        )}
      </div>

      {/* Permission Matrix */}
      <div className='flex flex-col gap-4 rounded-lg border bg-card p-6'>
        <h3 className='font-semibold'>Permissions</h3>

        {allPermissions.length === 0 && (
          <p className='text-muted-foreground'>No permissions available.</p>
        )}

        {/* Admin Permissions */}
        {adminPerms.length > 0 && (
          <div className='flex flex-col gap-3'>
            <h4 className='text-sm font-medium text-muted-foreground'>Admin</h4>
            <div className='flex flex-col gap-2'>
              {adminPerms.map((perm) => (
                <PermissionRow
                  key={perm.id}
                  permission={perm}
                  checked={selectedIds.has(perm.id)}
                  onToggle={() => togglePermission(perm.id)}
                  disabled={role.is_system}
                />
              ))}
            </div>
          </div>
        )}

        {adminPerms.length > 0 && frontendPerms.length > 0 && (
          <Separator />
        )}

        {/* Frontend Permissions */}
        {frontendPerms.length > 0 && (
          <div className='flex flex-col gap-3'>
            <h4 className='text-sm font-medium text-muted-foreground'>Frontend</h4>
            <div className='flex flex-col gap-2'>
              {frontendPerms.map((perm) => (
                <PermissionRow
                  key={perm.id}
                  permission={perm}
                  checked={selectedIds.has(perm.id)}
                  onToggle={() => togglePermission(perm.id)}
                  disabled={role.is_system}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface PermissionRowProps {
  permission: IPermission
  checked: boolean
  onToggle: () => void
  disabled: boolean
}

function PermissionRow({ permission, checked, onToggle, disabled }: PermissionRowProps) {
  return (
    <div className='flex items-start gap-3 rounded-md border bg-background/50 p-3'>
      <Checkbox
        id={`perm-${permission.id}`}
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
        className='mt-0.5'
      />
      <div className='flex flex-1 flex-col gap-0.5'>
        <Label
          htmlFor={`perm-${permission.id}`}
          className={`cursor-pointer font-normal ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {permission.name}
        </Label>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <code className='rounded bg-muted px-1 font-mono'>{permission.code}</code>
          <span>{permission.description}</span>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/roles/$roleId')({
  component: RoleDetailPage,
})
