import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { adminRBACService, type IRole } from '@/services/admin-rbac'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

function RolesPage() {
  const [data, setData] = useState<IRole[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const rolesRoute = getRouteApi('/_authenticated/roles/')
  const navigate = rolesRoute.useNavigate()

  useEffect(() => {
    fetchRoles()
  }, [])

  function fetchRoles() {
    setLoading(true)
    adminRBACService
      .listRoles()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data)
        } else {
          toast.error(res.error || 'Failed to fetch roles')
        }
      })
      .catch(() => toast.error('Failed to fetch roles'))
      .finally(() => setLoading(false))
  }

  async function handleCreate() {
    if (!createName.trim()) {
      toast.error('Role name is required')
      return
    }
    setCreateLoading(true)
    try {
      const res = await adminRBACService.createRole({
        name: createName.trim(),
        description: createDescription.trim(),
      })
      if (res.success) {
        toast.success('Role created successfully')
        setCreateOpen(false)
        setCreateName('')
        setCreateDescription('')
        fetchRoles()
      } else {
        toast.error(res.error || 'Failed to create role')
      }
    } catch {
      toast.error('Failed to create role')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDelete(role: IRole) {
    if (!confirm(`Delete role "${role.name}"?`)) return
    const res = await adminRBACService.deleteRole(role.id)
    if (res.success) {
      toast.success('Role deleted')
      fetchRoles()
    } else {
      toast.error(res.error || 'Failed to delete role')
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Roles</h2>
          <p className='text-muted-foreground'>
            {loading ? 'Loading...' : `${data.length} roles total`}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size='sm'>
              <PlusIcon className='size-4' />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>
                Create a new role to assign permissions to users.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  placeholder='e.g. Content Editor'
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Description</Label>
                <Input
                  id='description'
                  placeholder='Optional description'
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className='w-[120px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                    <span className='animate-pulse'>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='h-24 text-center text-muted-foreground'
                >
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {role.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_system ? 'secondary' : 'outline'}>
                      {role.is_system ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {role.permissions?.length ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        onClick={() =>
                          navigate({ params: { roleId: String(role.id) } })
                        }
                      >
                        <PencilIcon className='size-4' />
                      </Button>
                      {!role.is_system && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive hover:text-destructive'
                          onClick={() => handleDelete(role)}
                        >
                          <TrashIcon className='size-4' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/roles/')({
  component: RolesPage,
})
